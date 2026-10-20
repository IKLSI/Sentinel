using FluentAssertions;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services.Dashboard;

public class ParkOverviewCalculatorTests
{
    private static readonly DateOnly Today = new(2026, 10, 19);

    [Fact]
    public void Build_AgregeScoresFaillesDependancesEtFinsDeVie()
    {
        Project tily = new ProjectGraphBuilder("Tily")
            .WithDependency("next", DependencyStatus.Vulnerable)
            .WithVulnerability("next", "CVE-1", VulnerabilitySeverity.Critical, 9.1m, isKnownExploited: true)
            .WithDependency("react", DependencyStatus.MajorUpdate, latestVersion: "2.0.0")
            .WithDependency("vitest", DependencyStatus.MajorUpdate, DependencyType.Dev, latestVersion: "2.0.0")
            .WithRuntime(".NET", "8", Today.AddDays(22).ToDateTime(TimeOnly.MinValue))
            .Build();

        Project sentinel = new ProjectGraphBuilder("Sentinel")
            .WithDependency("zod")
            .WithRuntime("Node", "22", Today.AddDays(193).ToDateTime(TimeOnly.MinValue))
            .Build();

        Project neverScanned = new ProjectGraphBuilder("Nouveau").BuildUnscored();

        Project[] projects = [tily, sentinel, neverScanned];

        ParkOverviewDto overview = ParkOverviewCalculator.Build(projects,
            RuntimeDeadlineCalculator.Compute(projects, Today), 5);

        overview.ProjectCount.Should().Be(3);
        overview.AverageScore.Should().Be((int)Math.Round((tily.HealthScore!.Value + sentinel.HealthScore!.Value) / 2.0));
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
        ParkOverviewDto overview = ParkOverviewCalculator.Build([new ProjectGraphBuilder().BuildUnscored()], [], null);

        overview.AverageScore.Should().BeNull();
        overview.Grade.Should().BeNull();
        overview.NextRuntimeEolInDays.Should().BeNull();
    }
}
