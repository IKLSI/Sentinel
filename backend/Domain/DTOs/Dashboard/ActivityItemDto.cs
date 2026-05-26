namespace Sentinel.Domain.DTOs.Dashboard;

public class ActivityItemDto
{
    public string Color { get; set; } = "accent";
    public string Text { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Detail { get; set; }
    public string? TooltipText { get; set; }
    public string? TicketId { get; set; }
    public string? ProjectId { get; set; }
    public int? Count { get; set; }
}
