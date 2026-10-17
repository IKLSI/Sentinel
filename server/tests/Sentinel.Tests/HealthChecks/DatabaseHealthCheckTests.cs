using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Sentinel.API.HealthChecks;
using Sentinel.Infrastructure.Data;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.HealthChecks;

public class DatabaseHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_QuandLaBaseRepond_RetourneHealthy()
    {
        using SentinelContext context = TestDbContextFactory.CreateInMemory();
        DatabaseHealthCheck healthCheck = new(context);

        HealthCheckResult result = await healthCheck.CheckHealthAsync(new HealthCheckContext(), TestContext.Current.CancellationToken);

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public async Task CheckHealthAsync_QuandLaBaseEstInjoignable_RetourneUnhealthy()
    {
        DbContextOptions<SentinelContext> options = new DbContextOptionsBuilder<SentinelContext>()
            .UseNpgsql("Host=127.0.0.1;Port=1;Database=absente;Username=x;Password=x;Timeout=1")
            .Options;
        using SentinelContext context = new(options);
        DatabaseHealthCheck healthCheck = new(context);

        HealthCheckResult result = await healthCheck.CheckHealthAsync(new HealthCheckContext(), TestContext.Current.CancellationToken);

        result.Status.Should().Be(HealthStatus.Unhealthy);
    }
}
