using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.ScoringModel;

public class ScoringModelGetService : IService
{
    private const int PointsDecimals = 1;

    public Result<ScoringModelDto> Execute() => new ScoringModelDto
    {
        Grades = HealthScoreCalculator.GradeThresholds
            .Select(threshold => new GradeThresholdDto { Grade = threshold.Grade, MinScore = threshold.MinScore })
            .ToList(),
        Penalties = HealthScoreCalculator.Penalties
            .Select(penalty => new ScorePenaltyDto { Kind = penalty.Kind, Points = penalty.Points })
            .ToList(),
        Examples = ScoringExampleProjects.All().Select(ToExampleDto).ToList(),
        MaxScore = HealthScoreCalculator.MaxScore,
        ScoreDecayConstant = HealthScoreCalculator.ScoreDecayConstant,
    };

    private static ScoringExampleDto ToExampleDto(Project project)
    {
        HealthScoreLedger ledger = HealthScoreCalculator.Itemize(project, ScoringExampleProjects.AsOf);

        return new ScoringExampleDto
        {
            Name = project.Name,
            Score = ledger.Score,
            RawScore = ledger.RawScore,
            Grade = ledger.Grade,
            Ceiling = ledger.Ceiling,
            CeilingReason = ledger.CeilingReason,
            TotalPenalty = RoundPoints(ledger.TotalPenalty),
            Lines = ledger.Lines.Select(ToLineDto).ToList(),
        };
    }

    private static ScoringExampleLineDto ToLineDto(ScorePenaltyLine line) => new()
    {
        Kind = line.Kind,
        Modifiers = line.Modifiers.ToList(),
        Multiplier = line.Multiplier,
        Count = line.Count,
        Points = RoundPoints(line.Points),
        Identifiers = line.Identifiers.ToList(),
        Packages = line.Packages.ToList(),
        RuntimeName = line.Runtime?.Name,
        RuntimeVersion = line.Runtime?.Version,
        EolDate = line.Runtime?.EolDate,
        Outdated = line.Outdated,
        TotalDirect = line.TotalDirect,
    };

    private static double RoundPoints(double points) =>
        Math.Round(points, PointsDecimals, MidpointRounding.AwayFromZero);
}
