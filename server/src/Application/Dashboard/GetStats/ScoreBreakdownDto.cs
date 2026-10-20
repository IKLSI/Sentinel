namespace Sentinel.Application.Dashboard.GetStats;

public class ScoreBreakdownDto
{
    public int Security { get; set; }
    public string SecurityGrade { get; set; } = string.Empty;
    public int Runtimes { get; set; }
    public string RuntimesGrade { get; set; } = string.Empty;
    public int Freshness { get; set; }
    public string FreshnessGrade { get; set; } = string.Empty;
}
