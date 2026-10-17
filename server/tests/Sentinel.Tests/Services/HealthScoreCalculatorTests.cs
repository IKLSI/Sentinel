using FluentAssertions;
using Sentinel.Domain.TechHealth;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class HealthScoreCalculatorTests
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

    private static Project ProjectWithDependencies(int count, DependencyStatus status,
        DependencyType type = DependencyType.Prod, bool isDirect = true)
    {
        (string current, string latest) = status switch
        {
            DependencyStatus.MajorUpdate => ("1.0.0", "2.0.0"),
            DependencyStatus.MinorUpdate => ("1.0.0", "1.1.0"),
            _ => ("1.0.0", "1.0.0"),
        };

        Project project = EmptyProject();
        for (int i = 0; i < count; i++)
        {
            project.Dependencies.Add(new Dependency
            {
                Name = $"dep-{i}",
                CurrentVersion = current,
                LatestVersion = latest,
                Type = type,
                IsDirect = isDirect,
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
    public void Resolve_WhenNeverScanned_ReturnsNotScanned()
    {
        ScanCoverage coverage = ScanCoverageResolver.Resolve(EmptyProject(), scanRan: false, scanError: null, manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.NotScanned);
    }

    [Fact]
    public void Resolve_WhenScanFailedAndNoExistingData_ReturnsFailed()
    {
        ScanCoverage coverage = ScanCoverageResolver.Resolve(
            EmptyProject(), scanRan: true, scanError: "Token expiré", manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.Failed);
    }

    [Fact]
    public void Resolve_WhenNoManifestCouldBeRead_ReturnsNoManifest()
    {
        ScanCoverage coverage = ScanCoverageResolver.Resolve(
            EmptyProject(), scanRan: true, scanError: null, manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.NoManifest);
    }

    [Fact]
    public void Resolve_WhenManifestReadButEmpty_ReturnsNoDependencies()
    {
        ScanCoverage coverage = ScanCoverageResolver.Resolve(
            EmptyProject(), scanRan: true, scanError: null, manifestsRead: 3);

        coverage.Should().Be(ScanCoverage.NoDependencies);
    }

    [Fact]
    public void Resolve_WhenScanFailedButDataPreserved_ReturnsCovered()
    {
        Project project = ProjectWithDependencies(1, DependencyStatus.UpToDate);

        ScanCoverage coverage = ScanCoverageResolver.Resolve(
            project, scanRan: true, scanError: "Limite de requêtes atteinte", manifestsRead: 0);

        coverage.Should().Be(ScanCoverage.Covered);
    }

    [Fact]
    public void Calculate_OutdatedPenaltyIsIndependentOfProjectSize()
    {
        Project small = ProjectWithDependencies(10, DependencyStatus.MinorUpdate);
        Project large = ProjectWithDependencies(500, DependencyStatus.MinorUpdate);

        HealthScoreCalculator.Calculate(small)
            .Should().Be(HealthScoreCalculator.Calculate(large));
    }

    [Fact]
    public void Calculate_OutdatedTransitiveDependencies_DoNotPenalizeTheScore()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.MajorUpdate, isDirect: false);

        HealthScoreCalculator.Calculate(project).Should().Be(100);
    }

    [Fact]
    public void Calculate_OutdatedTransitiveDependencies_DoNotDiluteTheDirectOnes()
    {
        Project project = ProjectWithDependencies(10, DependencyStatus.MajorUpdate);
        Project withTransitives = ProjectWithDependencies(10, DependencyStatus.MajorUpdate);
        foreach (Dependency transitive in ProjectWithDependencies(500, DependencyStatus.UpToDate, isDirect: false)
                     .Dependencies)
            withTransitives.Dependencies.Add(transitive);

        HealthScoreCalculator.Calculate(withTransitives).Should().Be(HealthScoreCalculator.Calculate(project));
    }

    [Fact]
    public void Calculate_VulnerableTransitiveDependency_IsPenalizedLikeADirectOne()
    {
        Project direct = ProjectWithDependencies(1, DependencyStatus.UpToDate);
        Project transitive = ProjectWithDependencies(1, DependencyStatus.UpToDate, isDirect: false);
        AddVulnerabilities(direct, VulnerabilitySeverity.Critical, 1);
        AddVulnerabilities(transitive, VulnerabilitySeverity.Critical, 1);

        HealthScoreCalculator.Calculate(transitive).Should().Be(HealthScoreCalculator.Calculate(direct));
    }

    [Fact]
    public void Calculate_AllMajorUpdates_AppliesMaxOutdatedPenalty()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.MajorUpdate);

        HealthScoreCalculator.Calculate(project).Should().Be(77);
    }

    [Fact]
    public void Calculate_AllMinorUpdates_AppliesHalfOutdatedPenalty()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.MinorUpdate);

        HealthScoreCalculator.Calculate(project).Should().Be(88);
    }

    [Fact]
    public void Calculate_AllUpToDate_ReturnsPerfectScore()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.UpToDate);

        HealthScoreCalculator.Calculate(project).Should().Be(100);
    }

    [Fact]
    public void Calculate_CriticalVulnerabilityPenaltyIsAbsolute()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerability(project.Dependencies.First(), VulnerabilitySeverity.Critical);

        HealthScoreCalculator.Calculate(project).Should().Be(90);
    }

    [Fact]
    public void Calculate_EolRuntime_AppliesPenalty()
    {
        Project project = ProjectWithDependencies(10, DependencyStatus.UpToDate);
        project.Runtimes.Add(new Runtime { Name = "Python", Version = "3.8", IsEol = true });

        HealthScoreCalculator.Calculate(project).Should().Be(90);
    }

    [Fact]
    public void Calculate_UnassessedRuntime_AppliesNoPenalty()
    {
        Project project = ProjectWithDependencies(10, DependencyStatus.UpToDate);
        project.Runtimes.Add(new Runtime { Name = "NestJS", Version = "10.3.0", IsEol = null });

        HealthScoreCalculator.Calculate(project).Should().Be(100);
    }

    [Fact]
    public void Calculate_MassiveVulnerabilityCount_NeverSaturatesAtZero()
    {
        Project project = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(project, VulnerabilitySeverity.High, 60);

        HealthScoreCalculator.Calculate(project).Should().BeGreaterThan(0);
    }

    [Fact]
    public void Calculate_FixingVulnerabilities_AlwaysRaisesScore()
    {
        Project heavilyAffected = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(heavilyAffected, VulnerabilitySeverity.High, 60);

        Project partiallyFixed = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(partiallyFixed, VulnerabilitySeverity.High, 30);

        HealthScoreCalculator.Calculate(partiallyFixed)
            .Should().BeGreaterThan(HealthScoreCalculator.Calculate(heavilyAffected));
    }

    [Fact]
    public void Calculate_OutdatedDevDependencies_WeighLessThanProdOnes()
    {
        Project prod = ProjectWithDependencies(50, DependencyStatus.MajorUpdate, DependencyType.Prod);
        Project dev = ProjectWithDependencies(50, DependencyStatus.MajorUpdate, DependencyType.Dev);

        HealthScoreCalculator.Calculate(dev)
            .Should().BeGreaterThan(HealthScoreCalculator.Calculate(prod));
    }

    [Fact]
    public void Calculate_VulnerableDevDependency_WeighsLessThanAProdOne()
    {
        Project prod = ProjectWithDependencies(10, DependencyStatus.UpToDate, DependencyType.Prod);
        AddVulnerability(prod.Dependencies.First(), VulnerabilitySeverity.Critical);

        Project dev = ProjectWithDependencies(10, DependencyStatus.UpToDate, DependencyType.Dev);
        AddVulnerability(dev.Dependencies.First(), VulnerabilitySeverity.Critical);

        HealthScoreCalculator.Calculate(dev)
            .Should().BeGreaterThan(HealthScoreCalculator.Calculate(prod));
    }

    [Fact]
    public void Calculate_VulnerableDependency_IsStillCountedAsOutdated()
    {
        Project outdated = ProjectWithDependencies(10, DependencyStatus.MajorUpdate);
        Project current = ProjectWithDependencies(10, DependencyStatus.UpToDate);

        foreach (Dependency dependency in outdated.Dependencies.Concat(current.Dependencies))
            dependency.Status = DependencyStatus.Vulnerable;

        HealthScoreCalculator.Calculate(outdated)
            .Should().BeLessThan(HealthScoreCalculator.Calculate(current));
    }

    [Fact]
    public void Calculate_WorseProject_AlwaysScoresLowerThanBadProject()
    {
        Project bad = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(bad, VulnerabilitySeverity.High, 20);

        Project worse = ProjectWithDependencies(50, DependencyStatus.UpToDate);
        AddVulnerabilities(worse, VulnerabilitySeverity.High, 80);

        HealthScoreCalculator.Calculate(worse)
            .Should().BeLessThan(HealthScoreCalculator.Calculate(bad));
    }

    [Fact]
    public void Calculate_KnownExploitedVulnerability_WeighsMoreThanAnUnexploitedOne()
    {
        Project unexploited = ProjectWithDependencies(10, DependencyStatus.UpToDate);
        AddVulnerability(unexploited.Dependencies.First(), VulnerabilitySeverity.High);

        Project exploited = ProjectWithDependencies(10, DependencyStatus.UpToDate);
        AddVulnerability(exploited.Dependencies.First(), VulnerabilitySeverity.High);
        exploited.Dependencies.First().Vulnerabilities.First().IsKnownExploited = true;

        HealthScoreCalculator.Calculate(exploited)
            .Should().BeLessThan(HealthScoreCalculator.Calculate(unexploited));
    }

    [Fact]
    public void Calculate_LikelyExploitedVulnerability_WeighsMoreThanAnUnlikelyOne()
    {
        Project unlikely = ProjectWithDependencies(10, DependencyStatus.UpToDate);
        AddVulnerability(unlikely.Dependencies.First(), VulnerabilitySeverity.High);
        unlikely.Dependencies.First().Vulnerabilities.First().EpssScore = 0.001m;

        Project likely = ProjectWithDependencies(10, DependencyStatus.UpToDate);
        AddVulnerability(likely.Dependencies.First(), VulnerabilitySeverity.High);
        likely.Dependencies.First().Vulnerabilities.First().EpssScore = 0.3m;

        HealthScoreCalculator.Calculate(likely)
            .Should().BeLessThan(HealthScoreCalculator.Calculate(unlikely));
    }
}
