namespace Sentinel.Application.ScoringModel;

public class ScoringModelDto
{
    public List<GradeThresholdDto> Grades { get; set; } = [];
    public List<ScorePenaltyDto> Penalties { get; set; } = [];
    public List<ScoringExampleDto> Examples { get; set; } = [];
    public int MaxScore { get; set; }
    public int ScoreDecayConstant { get; set; }
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

public class ScoringExampleDto
{
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public int RawScore { get; set; }
    public string Grade { get; set; } = string.Empty;
    public int? Ceiling { get; set; }
    public string? CeilingReason { get; set; }
    public double TotalPenalty { get; set; }
    public List<ScoringExampleLineDto> Lines { get; set; } = [];
}

public class ScoringExampleLineDto
{
    public string Kind { get; set; } = string.Empty;
    public List<string> Modifiers { get; set; } = [];
    public double? Multiplier { get; set; }
    public int Count { get; set; }
    public double Points { get; set; }
    public List<string> Identifiers { get; set; } = [];
    public List<string> Packages { get; set; } = [];
    public string? RuntimeName { get; set; }
    public string? RuntimeVersion { get; set; }
    public DateTime? EolDate { get; set; }
    public int? Outdated { get; set; }
    public int? TotalDirect { get; set; }
}
