using Microsoft.Extensions.Diagnostics.HealthChecks;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.HealthChecks;

public class DatabaseHealthCheck : IHealthCheck
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(3);

    private readonly SentinelContext _context;

    public DatabaseHealthCheck(SentinelContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        using CancellationTokenSource timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(Timeout);

        try
        {
            bool canConnect = await _context.Database.CanConnectAsync(timeoutSource.Token);
            return canConnect ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy();
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy();
        }
    }
}
