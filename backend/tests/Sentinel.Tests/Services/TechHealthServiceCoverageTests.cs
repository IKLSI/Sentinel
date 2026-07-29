using FluentAssertions;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Models;

namespace Sentinel.Tests.Services;

public class TechHealthServiceCoverageTests
{
    private static Project EmptyProject() => new Project
    {
        Id = Guid.NewGuid(),
        Name = "P",
        RepositoryType = RepositoryType.GitHub,
        ScanFrequency = ScanFrequency.Weekly,
        Dependencies = new List<Dependency>(),
        Runtimes = new List<Runtime>(),
    };

    private static Project ProjectWithDependencies(int count, DependencyStatus status)
    {
        Project project = EmptyProject();
        for (int i = 0; i < count; i++)
        {
            project.Dependencies.Add(new Dependency
            {
                Name = $"dep-{i}",
                CurrentVersion = "1.0.0",
                Status = status,
            });
        }
        return project;
    }

    private static void AddVulnerability(Dependency dependency, VulnerabilitySeverity severity)
    {
        dependency.Vulnerabilities.Add(new Vulnerability
        {
            CveId = $"CVE-2026-{dependency.Vulnerabilities.Count}-{dependency.Name}",
            Severity = severity,
        });
    }

    private static void AddVulnerabilities(Project project, VulnerabilitySeverity severity, int count)
    {
        for (int i = 0; i < count; i++)
            AddVulnerability(project.Dependencies.ElementAt(i % project.Dependencies.Count), severity);
    }

    [Fact]
    public void ResolveCoverage_WhenNeverScanned_ReturnsNotScanned()
    {
        ScanCoverage coverage = TechHealthService.ResolveCoverage(EmptyProject(), scanRan: false, scanError: null, manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.NotScanned);
    }

    [Fact]
    public void ResolveCoverage_WhenScanFailedAndNoExistingData_ReturnsFailed()
    {
        ScanCoverage coverage = TechHealthService.ResolveCoverage(
            EmptyProject(), scanRan: true, scanError: "Token expiré", manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.Failed);
    }

    [Fact]
    public void ResolveCoverage_WhenNoManifestCouldBeRead_ReturnsNoManifest()
    {
        ScanCoverage coverage = TechHealthService.ResolveCoverage(
            EmptyProject(), scanRan: true, scanError: null, manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.NoManifest);
    }

    [Fact]
    public void ResolveCoverage_WhenManifestReadButEmpty_ReturnsNoDependencies()
    {
        ScanCoverage coverage = TechHealthService.ResolveCoverage(
            EmptyProject(), scanRan: true, scanError: null, manifestsRead: 3);

        coverage.Should().Be(ScanCoverage.NoDependencies);
    }

    [Fact]
    public void ResolveCoverage_WhenScanFailedButDataPreserved_ReturnsCovered()
    {
        Project project = ProjectWithDependencies(1, DependencyStatus.UpToDate);

        ScanCoverage coverage = TechHealthService.ResolveCoverage(
            project, scanRan: true, scanError: "Limite de requêtes atteinte", manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.Covered);
    }

    [Fact]
    public void CalculateHealthScore_OutdatedPenaltyIsIndependentOfProjectSize()
    {
        Project small = ProjectWithDependencies(10, DependencyStatus.MinorUpdate);
        Project large = ProjectWithDependencies(500, DependencyStatus.MinorUpdate);

        TechHealthService.CalculateHealthScore(small)
            .Should().Be(TechHealthService.CalculateHealthScore(large));
    }

    [Fact]
    public void CalculateHealthScore_AllMajorUpdates_AppliesMaxOutdatedPenalty()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.MajorUpdate);

        TechHealthService.CalculateHealthScore(project).Should().Be(77);
    }

    [Fact]
    public void CalculateHealthScore_AllMinorUpdates_AppliesHalfOutdatedPenalty()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.MinorUpdate);

        TechHealthService.CalculateHealthScore(project).Should().Be(88);
    }

    [Fact]
    public void CalculateHealthScore_AllUpToDate_ReturnsPerfectScore()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.UpToDate);

        TechHealthService.CalculateHealthScore(project).Should().Be(100);
    }

    [Fact]
    public void CalculateHealthScore_CriticalVulnerabilityPenaltyIsAbsolute()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerability(project.Dependencies.First(), VulnerabilitySeverity.Critical);

        TechHealthService.CalculateHealthScore(project).Should().Be(90);
    }

    [Fact]
    public void CalculateHealthScore_EolRuntime_AppliesPenalty()
    {
        Project project = ProjectWithDependencies(10, DependencyStatus.UpToDate);
        project.Runtimes.Add(new Runtime { Name = "Python", Version = "3.8", IsEol = true });

        TechHealthService.CalculateHealthScore(project).Should().Be(90);
    }

    [Fact]
    public void CalculateHealthScore_MassiveVulnerabilityCount_NeverSaturatesAtZero()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(project, VulnerabilitySeverity.High, 60);

        TechHealthService.CalculateHealthScore(project).Should().BeGreaterThan(0);
    }

    [Fact]
    public void CalculateHealthScore_FixingVulnerabilities_AlwaysRaisesScore()
    {
        Project heavilyAffected = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(heavilyAffected, VulnerabilitySeverity.High, 60);

        Project partiallyFixed = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(partiallyFixed, VulnerabilitySeverity.High, 30);

        TechHealthService.CalculateHealthScore(partiallyFixed)
            .Should().BeGreaterThan(TechHealthService.CalculateHealthScore(heavilyAffected));
    }

    [Fact]
    public void CalculateHealthScore_WorseProject_AlwaysScoresLowerThanBadProject()
    {
        Project bad = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(bad, VulnerabilitySeverity.High, 20);

        Project worse = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(worse, VulnerabilitySeverity.High, 80);

        TechHealthService.CalculateHealthScore(worse)
            .Should().BeLessThan(TechHealthService.CalculateHealthScore(bad));
    }
}
