using FluentAssertions;
using Sentinel.Application.TechHealth.ScoringModel;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class HealthScoreLedgerTests
{
    private static readonly DateTime Now = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static Project NewProject() => new()
    {
        Name = "P",
        Dependencies = new List<Dependency>(),
        Runtimes = new List<Runtime>()
    };

    private static Dependency AddDependency(Project project, string name, string latestVersion = "1.0.0",
        DependencyType type = DependencyType.Prod, bool isDeprecated = false)
    {
        Dependency dependency = new()
        {
            Name = name,
            CurrentVersion = "1.0.0",
            LatestVersion = latestVersion,
            Type = type,
            IsDeprecated = isDeprecated,
            Vulnerabilities = new List<Vulnerability>()
        };
        project.Dependencies.Add(dependency);
        return dependency;
    }

    private static void AddVulnerability(Dependency dependency, VulnerabilitySeverity severity,
        bool isKnownExploited = false, decimal? epssScore = null, string? alias = null) =>
        dependency.Vulnerabilities.Add(new Vulnerability
        {
            CveId = alias ?? $"CVE-2026-{dependency.Name}-{dependency.Vulnerabilities.Count}",
            CveAlias = alias,
            Severity = severity,
            IsKnownExploited = isKnownExploited,
            EpssScore = epssScore
        });

    private static Project MixedProject()
    {
        Project project = NewProject();
        Dependency web = AddDependency(project, "web", "2.0.0");
        Dependency orm = AddDependency(project, "orm", "1.1.0");
        Dependency legacy = AddDependency(project, "legacy", isDeprecated: true);
        Dependency tooling = AddDependency(project, "tooling", type: DependencyType.Dev);
        AddDependency(project, "fresh");

        AddVulnerability(web, VulnerabilitySeverity.Critical, isKnownExploited: true, alias: "CVE-2025-55182");
        AddVulnerability(orm, VulnerabilitySeverity.Critical, epssScore: 0.5m);
        AddVulnerability(orm, VulnerabilitySeverity.High);
        AddVulnerability(legacy, VulnerabilitySeverity.High);
        AddVulnerability(tooling, VulnerabilitySeverity.High);
        AddVulnerability(web, VulnerabilitySeverity.Medium);
        AddVulnerability(web, VulnerabilitySeverity.Low);

        project.Runtimes.Add(new Runtime { Name = "Node.js", Version = "16", IsEol = true });
        project.Runtimes.Add(new Runtime { Name = ".NET", Version = "8", IsEol = false, EolDate = Now.AddDays(20) });

        return project;
    }

    [Fact]
    public void Itemize_ScoreMatchesCalculate()
    {
        IEnumerable<Project> projects = ScoringExampleProjects.All().Append(MixedProject()).Append(NewProject());

        foreach (Project project in projects)
            HealthScoreCalculator.Itemize(project, DateTime.UtcNow).Score
                .Should().Be(HealthScoreCalculator.Calculate(project), project.Name);
    }

    [Fact]
    public void Itemize_LinePointsSumToTheTotalPenaltyBehindTheRawScore()
    {
        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(MixedProject(), Now);

        double linesTotal = ledger.Lines.Sum(line => line.Points);

        linesTotal.Should().BeApproximately(ledger.TotalPenalty, 1e-9);
        ledger.RawScore.Should().Be((int)Math.Round(100 * Math.Exp(-linesTotal / 150)));
    }

    [Fact]
    public void Itemize_ActivelyExploitedProductionVulnerability_AppliesTheLowestCeiling()
    {
        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(MixedProject(), Now);

        ledger.Ceiling.Should().Be(59);
        ledger.CeilingReason.Should().Be(ScoreCeilingReasons.ActivelyExploited);
        ledger.Score.Should().Be(Math.Min(ledger.RawScore, 59));
        ledger.Grade.Should().Be(HealthScoreCalculator.ToGrade(ledger.Score));
    }

    [Fact]
    public void Itemize_CriticalProductionVulnerability_CapsTheScoreAt74()
    {
        Project project = NewProject();
        AddVulnerability(AddDependency(project, "web"), VulnerabilitySeverity.Critical);

        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(project, Now);

        ledger.RawScore.Should().Be(90);
        ledger.Ceiling.Should().Be(74);
        ledger.CeilingReason.Should().Be(ScoreCeilingReasons.CriticalInProduction);
        ledger.Score.Should().Be(74);
    }

    [Fact]
    public void Itemize_WithoutCeilingCondition_ReportsNoCeiling()
    {
        Project project = NewProject();
        AddVulnerability(AddDependency(project, "tooling", type: DependencyType.Dev), VulnerabilitySeverity.Critical);

        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(project, Now);

        ledger.Ceiling.Should().BeNull();
        ledger.CeilingReason.Should().BeNull();
        ledger.Score.Should().Be(ledger.RawScore);
    }

    [Fact]
    public void Itemize_GroupsVulnerabilitiesBySeverityAndMultiplier()
    {
        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(MixedProject(), Now);

        ScorePenaltyLine exploited = ledger.Lines.Single(line =>
            line.Kind == ScorePenaltyKinds.CriticalVulnerability
            && line.Modifiers.Contains(ScorePenaltyModifiers.ActivelyExploited));
        ScorePenaltyLine likely = ledger.Lines.Single(line =>
            line.Kind == ScorePenaltyKinds.CriticalVulnerability
            && line.Modifiers.Contains(ScorePenaltyModifiers.LikelyExploited));
        ScorePenaltyLine high = ledger.Lines.Single(line =>
            line.Kind == ScorePenaltyKinds.HighVulnerability && line.Modifiers.Count == 0);
        ScorePenaltyLine devHigh = ledger.Lines.Single(line =>
            line.Kind == ScorePenaltyKinds.HighVulnerability
            && line.Modifiers.Contains(ScorePenaltyModifiers.DevDependency));

        exploited.Should().BeEquivalentTo(new { Count = 1, Points = 30.0, Multiplier = (double?)2 });
        exploited.Identifiers.Should().Equal("CVE-2025-55182");
        likely.Should().BeEquivalentTo(new { Count = 1, Points = 22.5, Multiplier = (double?)1.5 });
        high.Should().BeEquivalentTo(new { Count = 2, Points = 20.0, Multiplier = (double?)null });
        high.Packages.Should().BeEquivalentTo("orm", "legacy");
        devHigh.Should().BeEquivalentTo(new { Count = 1, Points = 2.5, Multiplier = (double?)0.25 });
    }

    [Fact]
    public void Itemize_ItemizesDeprecationRuntimesAndVersionLag()
    {
        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(MixedProject(), Now);

        ScorePenaltyLine deprecated = ledger.Lines.Single(line => line.Kind == ScorePenaltyKinds.EolDependency);
        ScorePenaltyLine eolRuntime = ledger.Lines.Single(line => line.Kind == ScorePenaltyKinds.EolRuntime);
        ScorePenaltyLine approaching =
            ledger.Lines.Single(line => line.Kind == ScorePenaltyKinds.ApproachingEolRuntime);
        ScorePenaltyLine versionLag = ledger.Lines.Single(line => line.Kind == ScorePenaltyKinds.VersionLag);

        deprecated.Should().BeEquivalentTo(new { Count = 1, Points = 10.0 });
        deprecated.Packages.Should().Equal("legacy");
        eolRuntime.Points.Should().Be(15);
        eolRuntime.Runtime!.Name.Should().Be("Node.js");
        approaching.Points.Should().Be(5);
        approaching.Runtime!.Version.Should().Be("8");
        versionLag.Should().BeEquivalentTo(new { Count = 1, Outdated = (int?)2, TotalDirect = (int?)5 });
        versionLag.Points.Should().BeApproximately(3.0 / 10 * 40, 1e-9);
    }

    [Fact]
    public void Itemize_SortsLinesByPointsDescending()
    {
        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(MixedProject(), Now);

        ledger.Lines.Select(line => line.Points).Should().BeInDescendingOrder();
    }

    [Fact]
    public void Itemize_ApproachingEolDependsOnTheGivenDate()
    {
        Project project = NewProject();
        project.Runtimes.Add(new Runtime { Name = ".NET", Version = "8", IsEol = false, EolDate = Now.AddDays(20) });

        HealthScoreCalculator.Itemize(project, Now).Lines.Should().ContainSingle();
        HealthScoreCalculator.Itemize(project, Now.AddDays(-200)).Lines.Should().BeEmpty();
    }
}
