namespace Sentinel.Application.Dashboard.GetStats;

public class DependencyCountsDto
{
    public int Total { get; set; }
    public int UpToDate { get; set; }
    public int MinorUpdate { get; set; }
    public int MajorUpdate { get; set; }
    public int EndOfLife { get; set; }
    public int Vulnerable { get; set; }
}
