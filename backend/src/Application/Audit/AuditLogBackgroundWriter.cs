using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Audit;

public class AuditLogBackgroundWriter(
    AuditLogQueue auditLogQueue,
    IScopedServiceRunner scopeRunner,
    ISystemScope systemScope,
    ILogger<AuditLogBackgroundWriter> logger) : BackgroundService
{
    private const int BatchSize = 100;
    private const int MaxFlushAttempts = 3;
    private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan FlushRetryDelay = TimeSpan.FromSeconds(2);

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
                catch (OperationCanceledException) { }

                if (stoppingToken.IsCancellationRequested) break;

                if (buffer.Count > 0)
                {
                    await FlushAsync(buffer, stoppingToken);
                    buffer.Clear();
                }

                ReportDroppedEntries();
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "AuditLog writer loop exception");

                try { await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken); }
                catch (OperationCanceledException) { }
            }
        }

        while (auditLogQueue.Reader.TryRead(out AuditLog? pending))
        {
            buffer.Add(pending);

            if (buffer.Count < BatchSize) continue;

            await FlushAsync(buffer, CancellationToken.None);
            buffer.Clear();
        }

        if (buffer.Count > 0)
            await FlushAsync(buffer, CancellationToken.None);

        ReportDroppedEntries();
    }

    private void ReportDroppedEntries()
    {
        long dropped = auditLogQueue.ReadAndResetDroppedCount();

        if (dropped > 0)
            logger.LogError("Audit queue saturated: {Count} entry(ies) dropped without being persisted", dropped);
    }

    private async Task FlushAsync(List<AuditLog> logs, CancellationToken ct)
    {
        for (int attempt = 1; attempt <= MaxFlushAttempts; attempt++)
        {
            try
            {
                using IDisposable elevation = systemScope.Enter();

                await scopeRunner.RunAsync<AuditLogBatchWriter>(writer => writer.WriteAsync(logs, ct));

                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex,
                    "AuditLog batch insert failed ({Count} entries), attempt {Attempt}/{MaxAttempts}",
                    logs.Count, attempt, MaxFlushAttempts);

                if (attempt == MaxFlushAttempts) break;

                try { await Task.Delay(FlushRetryDelay * attempt, ct); }
                catch (OperationCanceledException) { break; }
            }
        }

        foreach (AuditLog log in logs)
        {
            logger.LogError(
                "Audit entry lost: action={Action} type={EntityType} organization={OrganizationId} user={UserId} entity={EntityId} jti={Jti} date={CreatedAt:O}",
                log.Action, log.EntityType, log.OrganizationId, log.UserId, log.EntityId, log.Jti, log.CreatedAt);
        }
    }
}
