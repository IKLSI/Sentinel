using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class ProjectSummaryQueryTests
{
    private const string UnusedConnectionString =
        "Host=localhost;Database=sentinel_translation_check;Username=none;Password=none";

    [Fact]
    public void SummariesByHealthRank_LitLesCompteursSansAgregerLInventaire()
    {
        using SentinelContext context = new SentinelContext(
            new DbContextOptionsBuilder<SentinelContext>().UseNpgsql(UnusedConnectionString).Options,
            new UnsetTenantContext(),
            new SystemScope());

        string sql = new ProjectRepository(context).SummariesByHealthRank(Guid.NewGuid()).ToQueryString();

        sql.Should().Contain("\"InventoryCounts_CriticalVulnerabilities\"");
        sql.Should().NotContain("\"Vulnerabilities\"");
        sql.Should().NotContain("\"Dependencies\"");
        sql.Should().Contain("ORDER BY");
    }

    [Fact]
    public async Task ListSummariesByHealthRankAsync_CompteParProjetEtPlaceLesCritiquesEnTete()
    {
        using TestScope scope = new TestScope();
        Project healthy = NewProject(scope, "Alpha", healthScore: 90);
        Project critical = NewProject(scope, "Beta", healthScore: 95);
        Project empty = NewProject(scope, "Gamma", healthScore: null);

        Dependency criticalDependency = NewDependency(critical);
        criticalDependency.Vulnerabilities.Add(NewVulnerability(VulnerabilitySeverity.Critical, knownExploited: true));
        criticalDependency.Vulnerabilities.Add(NewVulnerability(VulnerabilitySeverity.High, knownExploited: false));
        critical.Dependencies.Add(criticalDependency);
        critical.Dependencies.Add(NewDependency(critical));
        healthy.Dependencies.Add(NewDependency(healthy));
        foreach (Project project in new[] { healthy, critical, empty })
            project.InventoryCounts = ProjectInventoryCounts.Of(project.Dependencies);

        await scope.SeedAsync(scope.NewOrganization(), healthy, critical, empty,
            NewTicket(scope, critical.Id), NewTicket(scope, critical.Id), NewTicket(scope, projectId: null));

        IReadOnlyList<ProjectSummaryRow> rows =
            await scope.Projects.ListSummariesByHealthRankAsync(scope.OrganizationId,
                TestContext.Current.CancellationToken);

        rows.Select(row => row.Name).First().Should().Be("Beta");

        ProjectSummaryRow criticalRow = rows.Single(row => row.Id == critical.Id);
        criticalRow.TotalDependencies.Should().Be(2);
        criticalRow.CriticalVulnerabilities.Should().Be(1);
        criticalRow.TotalVulnerabilities.Should().Be(2);
        criticalRow.KnownExploitedVulnerabilities.Should().Be(1);
        criticalRow.TotalTickets.Should().Be(2);

        ProjectSummaryRow emptyRow = rows.Single(row => row.Id == empty.Id);
        emptyRow.TotalDependencies.Should().Be(0);
        emptyRow.TotalVulnerabilities.Should().Be(0);
        emptyRow.TotalTickets.Should().Be(0);
    }

    private static Project NewProject(TestScope scope, string name, int? healthScore) => new()
    {
        OrganizationId = scope.OrganizationId,
        Name = name,
        HealthScore = healthScore,
        Coverage = ScanCoverage.Covered
    };

    private static Dependency NewDependency(Project project) => new()
    {
        ProjectId = project.Id,
        Name = $"package-{Guid.NewGuid():N}",
        CurrentVersion = "1.0.0"
    };

    private static Vulnerability NewVulnerability(VulnerabilitySeverity severity, bool knownExploited) => new()
    {
        CveId = $"CVE-2026-{Random.Shared.Next(10000, 99999)}",
        PackageName = "package",
        Severity = severity,
        IsKnownExploited = knownExploited
    };

    private static Ticket NewTicket(TestScope scope, Guid? projectId) => new()
    {
        OrganizationId = scope.OrganizationId,
        ProjectId = projectId,
        Title = "Ticket"
    };

    private sealed class UnsetTenantContext : ITenantContext
    {
        public Guid? OrganizationId => null;
        public Guid? UserId => null;
        public string? Jti => null;
        public bool IsSet => false;
        public void Reset() { }
    }
}
