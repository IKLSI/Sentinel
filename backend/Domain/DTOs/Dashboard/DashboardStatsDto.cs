namespace TMAflow.Domain.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int OpenTickets { get; set; }
    public int OpenTicketsDelta { get; set; }
    public int ResolvedThisMonth { get; set; }
    public int ResolvedThisMonthDelta { get; set; }
    public int HoursThisMonth { get; set; }
    public decimal BillableRevenue { get; set; }
    public decimal UnbilledRevenue { get; set; }
    public int CriticalVulnerabilities { get; set; }
    public int SlaRespected { get; set; }
    public int SlaRespectedDelta { get; set; }
    public Dictionary<string, int> TicketsByStatus { get; set; } = [];
    public Dictionary<string, int> TicketsByPriority { get; set; } = [];
    public int UnassignedOpenTickets { get; set; }
    public int OverdueInvoicesCount { get; set; }
    public decimal OverdueInvoicesAmount { get; set; }
    public List<UrgentTicketDto> UrgentTickets { get; set; } = [];
    public List<ActivityItemDto> RecentActivity { get; set; } = [];
}
