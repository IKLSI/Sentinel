namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsRequest
{
    public DashboardPeriod Period { get; set; } = DashboardPeriod.Month;
}
