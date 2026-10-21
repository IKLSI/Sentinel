using FluentAssertions;
using Sentinel.Application.TechHealth.ScoringModel;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class ScoringModelGetServiceTests
{
    private static ScoringExampleDto Example(string name) =>
        new ScoringModelGetService().Execute().Value!.Examples.Single(example => example.Name == name);

    [Theory]
    [InlineData(ScoringExampleProjects.OnlineStore, "F", 28, 59, ScoreCeilingReasons.ActivelyExploited)]
    [InlineData(ScoringExampleProjects.PaymentApi, "E", 41, 74, ScoreCeilingReasons.CriticalInProduction)]
    [InlineData(ScoringExampleProjects.CustomerPortal, "B", 82, null, null)]
    [InlineData(ScoringExampleProjects.MobileApp, "B", 87, null, null)]
    public void Execute_ExamplesLandOnTheirExpectedGrade(string name, string grade, int score, int? ceiling,
        string? ceilingReason)
    {
        ScoringExampleDto example = Example(name);

        example.Grade.Should().Be(grade);
        example.Score.Should().Be(score);
        example.Ceiling.Should().Be(ceiling);
        example.CeilingReason.Should().Be(ceilingReason);
        example.Lines.Select(line => line.Points).Should().BeInDescendingOrder();
    }

    [Fact]
    public void Execute_ExposesTheScoreFormulaConstants()
    {
        ScoringModelDto model = new ScoringModelGetService().Execute().Value!;

        model.MaxScore.Should().Be(HealthScoreCalculator.MaxScore);
        model.ScoreDecayConstant.Should().Be(HealthScoreCalculator.ScoreDecayConstant);
    }

    [Fact]
    public void Execute_ReturnsTheFourExamplesInOrder()
    {
        new ScoringModelGetService().Execute().Value!.Examples.Select(example => example.Name).Should().Equal(
            ScoringExampleProjects.OnlineStore, ScoringExampleProjects.PaymentApi,
            ScoringExampleProjects.CustomerPortal, ScoringExampleProjects.MobileApp);
    }

    [Fact]
    public void Execute_OnlineStore_ExposesTheExploitedCriticalAndTheEndOfLifeRuntime()
    {
        ScoringExampleDto example = Example(ScoringExampleProjects.OnlineStore);

        ScoringExampleLineDto critical =
            example.Lines.Single(line => line.Kind == ScorePenaltyKinds.CriticalVulnerability);
        ScoringExampleLineDto runtime = example.Lines.Single(line => line.Kind == ScorePenaltyKinds.EolRuntime);
        ScoringExampleLineDto versionLag = example.Lines.Single(line => line.Kind == ScorePenaltyKinds.VersionLag);

        critical.Should().BeEquivalentTo(new { Count = 1, Points = 30.0, Multiplier = (double?)2 });
        critical.Modifiers.Should().Equal(ScorePenaltyModifiers.ActivelyExploited);
        critical.Identifiers.Should().Equal("CVE-2025-55182");
        runtime.Should().BeEquivalentTo(new { RuntimeName = "Node.js", RuntimeVersion = "20" });
        versionLag.Should().BeEquivalentTo(new { Outdated = (int?)18, TotalDirect = (int?)31, Points = 23.2 });
        example.Lines.Single(line => line.Kind == ScorePenaltyKinds.EolDependency).Packages
            .Should().Equal("request", "node-sass");
        example.RawScore.Should().Be(example.Score);
    }

    [Fact]
    public void Execute_PaymentApi_ExposesTheLikelyExploitedCriticalAndTheApproachingRuntime()
    {
        ScoringExampleDto example = Example(ScoringExampleProjects.PaymentApi);

        example.Lines.Single(line => line.Kind == ScorePenaltyKinds.CriticalVulnerability)
            .Should().BeEquivalentTo(new { Points = 22.5, Multiplier = (double?)1.5 });
        example.Lines.Single(line => line.Kind == ScorePenaltyKinds.ApproachingEolRuntime)
            .Should().BeEquivalentTo(new { RuntimeName = ".NET", RuntimeVersion = "8", Points = 5.0 });
    }

    [Fact]
    public void Execute_MobileApp_WeightsTheDevDependencyVulnerability()
    {
        ScoringExampleDto example = Example(ScoringExampleProjects.MobileApp);

        ScoringExampleLineDto high = example.Lines.Single(line => line.Kind == ScorePenaltyKinds.HighVulnerability);

        high.Should().BeEquivalentTo(new { Points = 2.5, Multiplier = (double?)0.25 });
        high.Modifiers.Should().Equal(ScorePenaltyModifiers.DevDependency);
    }
}
