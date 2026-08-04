namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsDto
{
    public List<UrgentTicketDto> UrgentTickets { get; set; } = [];
    public List<ActivityItemDto> RecentActivity { get; set; } = [];
    public List<VulnerabilityDetectionDataPointDto> VulnerabilitiesDetectedPerDay { get; set; } = [];
}
