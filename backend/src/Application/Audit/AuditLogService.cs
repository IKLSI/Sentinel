using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Audit;

public interface IAuditLogService
{
    Task LogAsync(
        AuditAction action,
        string entityType,
        Guid? organizationId = null,
        Guid? userId = null,
        Guid? entityId = null,
        string? jti = null);
}

public class AuditLogService(AuditLogQueue queue) : IAuditLogService
{
    public Task LogAsync(
        AuditAction action,
        string entityType,
        Guid? organizationId = null,
        Guid? userId = null,
        Guid? entityId = null,
        string? jti = null)
    {
        queue.Enqueue(new AuditLog
        {
            OrganizationId = organizationId,
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Jti = jti,
            CreatedAt = DateTime.UtcNow
        });

        return Task.CompletedTask;
    }
}

public class AuditLogQueue
{
    private readonly Channel<AuditLog> _channel;

    public AuditLogQueue()
    {
        _channel = Channel.CreateBounded<AuditLog>(new BoundedChannelOptions(10_000)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public void Enqueue(AuditLog log) => _channel.Writer.TryWrite(log);

    public ChannelReader<AuditLog> Reader => _channel.Reader;
}

public class AuditLogBackgroundWriter(
    AuditLogQueue auditLogQueue,
    IServiceScopeFactory scopeFactory,
    ISystemScope systemScope,
    ILogger<AuditLogBackgroundWriter> logger) : BackgroundService
{
    private const int BatchSize = 100;
    private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(2);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        List<AuditLog> buffer = new List<AuditLog>(BatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using CancellationTokenSource flushCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                flushCts.CancelAfter(FlushInterval);

                try
                {
                    while (buffer.Count < BatchSize && await auditLogQueue.Reader.WaitToReadAsync(flushCts.Token))
                    {
                        while (buffer.Count < BatchSize && auditLogQueue.Reader.TryRead(out AuditLog? log))
                        {
                            buffer.Add(log);
                        }
                    }
                }
                catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested) { }

                if (buffer.Count > 0)
                {
                    await FlushAsync(buffer, stoppingToken);
                    buffer.Clear();
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "AuditLog writer loop exception");
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }

        if (buffer.Count > 0)
        {
            try { await FlushAsync(buffer, CancellationToken.None); }
            catch (Exception ex) { logger.LogWarning(ex, "Échec flush final AuditLog"); }
        }
    }

    private async Task FlushAsync(List<AuditLog> logs, CancellationToken ct)
    {
        try
        {
            using IDisposable elevation = systemScope.Enter();
            using IServiceScope scope = scopeFactory.CreateScope();

            IAuditLogRepository repository = scope.ServiceProvider.GetRequiredService<IAuditLogRepository>();
            ICommitScopeFactory commitScopeFactory = scope.ServiceProvider.GetRequiredService<ICommitScopeFactory>();

            using ICommitScope commitScope = commitScopeFactory.Begin();

            await repository.AddRangeAsync(logs, ct);
            await commitScope.CommitAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Échec insertion batch AuditLog ({Count} entrées)", logs.Count);
        }
    }
}
