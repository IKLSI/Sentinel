namespace Sentinel.Domain.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int OpenTickets { get; set; }
    public int OpenTicketsDelta { get; set; }
    public int ResolvedThisMonth { get; set; }
    public int ResolvedThisMonthDelta { get; set; }
    public int CriticalVulnerabilities { get; set; }
    public Dictionary<string, int> TicketsByStatus { get; set; } = [];
    public Dictionary<string, int> TicketsByPriority { get; set; } = [];
    public int UnassignedOpenTickets { get; set; }
    public List<UrgentTicketDto> UrgentTickets { get; set; } = [];
    public List<ActivityItemDto> RecentActivity { get; set; } = [];
    public List<VulnerabilityDetectionDataPointDto> VulnerabilitiesDetectedPerDay { get; set; } = [];
}
