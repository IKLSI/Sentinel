using FluentAssertions;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services.Dashboard;

public class ParkOverviewCalculatorTests
{
    private static readonly DateOnly Today = new(2026, 10, 19);

    private static DashboardProjectRow ProjectRow(string name, int? score, string? grade) =>
        new(Guid.NewGuid(), name, RepositoryType.GitHub, null, ScanCoverage.Covered, null, score, grade);

    [Fact]
    public void Build_AgregeScoresFaillesDependancesEtFinsDeVie()
    {
        DashboardProjectRow tily = ProjectRow("Tily", 62, "C");
        DashboardProjectRow sentinel = ProjectRow("Sentinel", 96, "A");
        DashboardProjectRow neverScanned = ProjectRow("Nouveau", null, null);

        IReadOnlyList<RuntimeDeadline> deadlines = RuntimeDeadlineCalculator.Compute(
        [
            new DashboardRuntimeRow(tily.Id, ".NET", "8", Today.AddDays(22).ToDateTime(TimeOnly.MinValue), false,
                false),
            new DashboardRuntimeRow(sentinel.Id, "Node", "22", Today.AddDays(193).ToDateTime(TimeOnly.MinValue), false,
                false),
        ], Today);

        ParkOverviewDto overview = ParkOverviewCalculator.Build([tily, sentinel, neverScanned],
            new VulnerabilityTotalsRow(1, 1, 0, 0, 0, 1),
            new DependencyTotalsRow(4, 1, 0, 2, 0, 1, 1),
            deadlines, 5);

        overview.ProjectCount.Should().Be(3);
        overview.AverageScore.Should().Be(79);
        overview.ScoreDelta.Should().Be(5);
        overview.Vulnerabilities.Critical.Should().Be(1);
        overview.Vulnerabilities.KnownExploited.Should().Be(1);
        overview.Dependencies.Total.Should().Be(4);
        overview.Dependencies.MajorUpdate.Should().Be(2);
        overview.MajorUpdatesInProduction.Should().Be(1);
        overview.RuntimesEndingSoon.Should().Be(1);
        overview.NextRuntimeEolInDays.Should().Be(22);
        overview.GradeDistribution.Sum(g => g.Count).Should().Be(2);
    }

    [Fact]
    public void Build_AucunProjetEvalue_ScoreIndisponible()
    {
        ParkOverviewDto overview = ParkOverviewCalculator.Build([ProjectRow("Nouveau", null, null)],
            VulnerabilityTotalsRow.Empty, DependencyTotalsRow.Empty, [], null);

        overview.AverageScore.Should().BeNull();
        overview.Grade.Should().BeNull();
        overview.NextRuntimeEolInDays.Should().BeNull();
    }
}
