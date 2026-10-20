namespace Sentinel.Application.Dashboard.GetStats;

public class NextActionDto
{
    public NextActionKind Kind { get; set; }
    public string? Target { get; set; }
    public string? Version { get; set; }
    public Guid? TicketId { get; set; }
    public string? TicketReference { get; set; }
}
