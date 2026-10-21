using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.ScoringModel;

public class ScoringModelGetService : IService
{
    public Result<ScoringModelDto> Execute() => new ScoringModelDto
    {
        Grades = HealthScoreCalculator.GradeThresholds
            .Select(threshold => new GradeThresholdDto { Grade = threshold.Grade, MinScore = threshold.MinScore })
            .ToList(),
        Penalties = HealthScoreCalculator.Penalties
            .Select(penalty => new ScorePenaltyDto { Kind = penalty.Kind, Points = penalty.Points })
            .ToList(),
    };
}
