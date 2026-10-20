namespace Sentinel.Application.Dashboard.GetStats;

public class ParkOverviewDto
{
    public int? AverageScore { get; set; }
    public string? Grade { get; set; }
    public int? ScoreDelta { get; set; }
    public int ProjectCount { get; set; }
    public List<GradeCountDto> GradeDistribution { get; set; } = [];
    public VulnerabilityCountsDto Vulnerabilities { get; set; } = new();
    public DependencyCountsDto Dependencies { get; set; } = new();
    public int RuntimesEndingSoon { get; set; }
    public int? NextRuntimeEolInDays { get; set; }
    public int MajorUpdatesInProduction { get; set; }
}
