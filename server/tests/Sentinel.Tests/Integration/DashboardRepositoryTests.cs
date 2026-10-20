using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class DashboardRepositoryTests
{
    private static readonly DateTime WindowStart = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly PostgresFixture _fixture;

    public DashboardRepositoryTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task GetVulnerabilityFlowCountsAsync_RegroupeDetectionsEtResolutionsParJourEnUneRequete()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        Project project = scope.NewProject();
        Dependency dependency = scope.NewDependency(project.Id);
        await scope.SeedAsync(scope.NewOrganization(), project, dependency);

        Vulnerability opened = scope.NewVulnerability(dependency.Id);
        opened.DetectedAt = WindowStart.AddDays(2).AddHours(10);
        Vulnerability beforeWindow = scope.NewVulnerability(dependency.Id);
        beforeWindow.DetectedAt = WindowStart.AddDays(-3);

        await scope.SeedAsync(opened, beforeWindow,
            NewResolution(scope, project, WindowStart.AddDays(1), WindowStart.AddDays(4)),
            NewResolution(scope, project, WindowStart.AddDays(-10), WindowStart.AddDays(4).AddHours(5)));

        VulnerabilityFlowCountsRow counts = await new DashboardRepository(scope.Context)
            .GetVulnerabilityFlowCountsAsync(scope.OrganizationId, WindowStart,
                TestContext.Current.CancellationToken);

        counts.Opened.Should().Equal(new Dictionary<DateTime, int> { [WindowStart.AddDays(2)] = 1 });
        counts.ResolvedDetections.Should().Equal(new Dictionary<DateTime, int> { [WindowStart.AddDays(1)] = 1 });
        counts.Resolutions.Should().Equal(new Dictionary<DateTime, int> { [WindowStart.AddDays(4)] = 2 });
    }

    [Fact]
    public async Task GetScoreSnapshotsAsync_RenvoieLaFenetreEtLeDernierScoreAnterieurParProjet()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        Project project = scope.NewProject();
        await scope.SeedAsync(scope.NewOrganization(), project);

        DateOnly windowStart = DateOnly.FromDateTime(WindowStart);

        await scope.SeedAsync(
            NewSnapshot(scope, project, windowStart.AddDays(-20), 50),
            NewSnapshot(scope, project, windowStart.AddDays(-5), 60),
            NewSnapshot(scope, project, windowStart.AddDays(3), 80));

        IReadOnlyList<ScoreSnapshotRow> snapshots = await new DashboardRepository(scope.Context)
            .GetScoreSnapshotsAsync(scope.OrganizationId, windowStart, TestContext.Current.CancellationToken);

        snapshots.Should().BeEquivalentTo(new[]
        {
            new ScoreSnapshotRow(project.Id, windowStart.AddDays(-5), 60),
            new ScoreSnapshotRow(project.Id, windowStart.AddDays(3), 80)
        });
    }

    private static VulnerabilityResolution NewResolution(PostgresScope scope, Project project, DateTime detectedAt,
        DateTime resolvedAt) => new()
    {
        OrganizationId = scope.OrganizationId,
        ProjectId = project.Id,
        CveId = $"GHSA-{Guid.NewGuid():N}",
        DetectedAt = detectedAt,
        ResolvedAt = resolvedAt
    };

    private static ProjectHealthSnapshot NewSnapshot(PostgresScope scope, Project project, DateOnly day,
        int score) => new()
    {
        OrganizationId = scope.OrganizationId,
        ProjectId = project.Id,
        Day = day,
        Score = score,
        Grade = "B"
    };
}
