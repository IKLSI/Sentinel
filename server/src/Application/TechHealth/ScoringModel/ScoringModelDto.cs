namespace Sentinel.Application.TechHealth.ScoringModel;

public class ScoringModelDto
{
    public List<GradeThresholdDto> Grades { get; set; } = [];
    public List<ScorePenaltyDto> Penalties { get; set; } = [];
}

public class GradeThresholdDto
{
    public string Grade { get; set; } = string.Empty;
    public int MinScore { get; set; }
}

public class ScorePenaltyDto
{
    public string Kind { get; set; } = string.Empty;
    public int Points { get; set; }
}
