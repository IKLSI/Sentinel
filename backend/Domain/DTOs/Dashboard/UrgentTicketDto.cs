namespace Sentinel.Domain.DTOs.Dashboard;

public class UrgentTicketDto
{
    public string Id { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ProjectName { get; set; }
    public bool SlaBreached { get; set; }
    public DateTime? SlaDeadline { get; set; }
}
