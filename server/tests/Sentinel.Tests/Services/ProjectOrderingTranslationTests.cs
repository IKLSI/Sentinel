using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Tests.Services;

public class ProjectOrderingTranslationTests
{
    private const string UnusedConnectionString =
        "Host=localhost;Database=sentinel_translation_check;Username=none;Password=none";

    private sealed class UnsetTenantContext : ITenantContext
    {
        public Guid? OrganizationId => null;
        public Guid? UserId => null;
        public string? Jti => null;
        public bool IsSet => false;
        public void Reset() { }
    }

    private static SentinelContext CreateNpgsqlContext()
    {
        DbContextOptions<SentinelContext> options = new DbContextOptionsBuilder<SentinelContext>()
            .UseNpgsql(UnusedConnectionString)
            .Options;
        return new SentinelContext(options, new UnsetTenantContext(), new SystemScope());
    }

    [Fact]
    public void GetProjectsOrdering_TranslatesToSqlWithoutClientEvaluation()
    {
        using SentinelContext context = CreateNpgsqlContext();

        string sql = context.Projects
            .AsNoTracking()
            .OrderByDescending(p => p.Dependencies.Any(d => d.Vulnerabilities.Any(v => v.Severity == VulnerabilitySeverity.Critical)))
            .ThenBy(p => p.Coverage == ScanCoverage.Covered ? 0 : 1)
            .ThenBy(p => p.HealthScore)
            .ThenBy(p => p.Name)
            .ToQueryString();

        sql.Should().Contain("ORDER BY");
        sql.Should().Contain("Coverage");
        sql.Should().Contain("Covered");
    }

    [Fact]
    public void CoverageComparison_TranslatesToStringLiteral()
    {
        using SentinelContext context = CreateNpgsqlContext();

        string sql = context.Projects
            .Where(p => p.Coverage == ScanCoverage.NotScanned)
            .ToQueryString();

        sql.Should().Contain("'NotScanned'");
    }
}
