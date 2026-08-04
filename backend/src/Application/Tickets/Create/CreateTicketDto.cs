using Sentinel.Domain.Models;

namespace Sentinel.Application.Tickets.Create;

public class CreateTicketDto
{
    public Guid? ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketType Type { get; set; } = TicketType.Bug;
    public Guid? AssignedToId { get; set; }
    public decimal? EstimatedHours { get; set; }
}
