namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsDto
{
    public ParkOverviewDto Overview { get; set; } = new();
    public List<ScorePointDto> ScoreHistory { get; set; } = [];
    public List<VulnerabilityFlowPointDto> VulnerabilityFlow { get; set; } = [];
    public List<UrgentTicketDto> UrgentTickets { get; set; } = [];
    public List<ProjectHealthDto> Projects { get; set; } = [];
    public List<ActivityItemDto> RecentActivity { get; set; } = [];
}
