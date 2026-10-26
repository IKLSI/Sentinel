using FluentAssertions;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class ProjectInventoryCountsTests
{
    [Fact]
    public void Of_CompteDependancesParStatutEtFaillesParSeverite()
    {
        Dependency vulnerable = NewDependency(DependencyStatus.Vulnerable);
        vulnerable.Vulnerabilities.Add(NewVulnerability(VulnerabilitySeverity.Critical, knownExploited: true));
        vulnerable.Vulnerabilities.Add(NewVulnerability(VulnerabilitySeverity.Low, knownExploited: false));
        Dependency majorInProduction = NewDependency(DependencyStatus.MajorUpdate);
        Dependency majorInDev = NewDependency(DependencyStatus.MajorUpdate, DependencyType.Dev);
        Dependency transitiveMajor = NewDependency(DependencyStatus.MajorUpdate, isDirect: false);
        Dependency deprecated = NewDependency(DependencyStatus.UpToDate, deprecated: true);

        ProjectInventoryCounts counts = ProjectInventoryCounts.Of(
            [vulnerable, majorInProduction, majorInDev, transitiveMajor, deprecated]);

        counts.Dependencies.Should().Be(5);
        counts.UpToDateDependencies.Should().Be(1);
        counts.MajorUpdates.Should().Be(3);
        counts.MajorUpdatesInProduction.Should().Be(1);
        counts.DeprecatedDependencies.Should().Be(1);
        counts.VulnerableDependencies.Should().Be(1);
        counts.Vulnerabilities.Should().Be(2);
        counts.CriticalVulnerabilities.Should().Be(1);
        counts.LowVulnerabilities.Should().Be(1);
        counts.KnownExploitedVulnerabilities.Should().Be(1);
    }

    [Fact]
    public void Sum_AdditionneLesCompteursDeChaqueProjet()
    {
        ProjectInventoryCounts total = ProjectInventoryCounts.Sum(
        [
            new ProjectInventoryCounts { Dependencies = 3, CriticalVulnerabilities = 1 },
            new ProjectInventoryCounts { Dependencies = 2, MinorUpdates = 1 },
        ]);

        total.Dependencies.Should().Be(5);
        total.CriticalVulnerabilities.Should().Be(1);
        total.MinorUpdates.Should().Be(1);
    }

    private static Dependency NewDependency(DependencyStatus status, DependencyType type = DependencyType.Prod,
        bool isDirect = true, bool deprecated = false) => new()
    {
        Name = $"package-{Guid.NewGuid():N}",
        CurrentVersion = "1.0.0",
        Status = status,
        Type = type,
        IsDirect = isDirect,
        IsDeprecated = deprecated
    };

    private static Vulnerability NewVulnerability(VulnerabilitySeverity severity, bool knownExploited) => new()
    {
        CveId = $"CVE-2026-{Random.Shared.Next(10000, 99999)}",
        PackageName = "package",
        Severity = severity,
        IsKnownExploited = knownExploited
    };
}
