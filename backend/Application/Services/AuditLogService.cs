using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

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

public class AuditLogService : IAuditLogService
{
    private readonly AuditLogQueue _queue;

    public AuditLogService(AuditLogQueue queue)
    {
        _queue = queue;
    }

    public Task LogAsync(
        AuditAction action,
        string entityType,
        Guid? organizationId = null,
        Guid? userId = null,
        Guid? entityId = null,
        string? jti = null)
    {
        _queue.Enqueue(new AuditLog
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

public class AuditLogBackgroundWriter : BackgroundService
{
    private readonly AuditLogQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditLogBackgroundWriter> _logger;
    private const int BatchSize = 100;
    private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(2);

    public AuditLogBackgroundWriter(
        AuditLogQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<AuditLogBackgroundWriter> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

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
                    while (buffer.Count < BatchSize && await _queue.Reader.WaitToReadAsync(flushCts.Token))
                    {
                        while (buffer.Count < BatchSize && _queue.Reader.TryRead(out AuditLog? log))
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
                _logger.LogWarning(ex, "AuditLog writer loop exception");
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }

        if (buffer.Count > 0)
        {
            try { await FlushAsync(buffer, CancellationToken.None); }
            catch (Exception ex) { _logger.LogWarning(ex, "Échec flush final AuditLog"); }
        }
    }

    private async Task FlushAsync(List<AuditLog> logs, CancellationToken ct)
    {
        try
        {
            using IServiceScope scope = _scopeFactory.CreateScope();
            SentinelContext context = scope.ServiceProvider.GetRequiredService<SentinelContext>();
            context.AuditLogs.AddRange(logs);
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Échec insertion batch AuditLog ({Count} entrées)", logs.Count);
        }
    }
}
