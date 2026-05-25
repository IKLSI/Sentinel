using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.HealthChecks;

public class PostgresHealthCheck : IHealthCheck
{
    private readonly SentinelContext _context;

    public PostgresHealthCheck(SentinelContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            bool canConnect = await _context.Database.CanConnectAsync(cancellationToken);

            return canConnect
                ? HealthCheckResult.Healthy("PostgreSQL accessible")
                : HealthCheckResult.Unhealthy("PostgreSQL injoignable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Erreur de connexion PostgreSQL", ex);
        }
    }
}
