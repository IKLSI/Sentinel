using Sentinel.Domain.Models;

namespace Sentinel.Domain.DTOs.Tickets;

public class UpdateTicketDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketType? Type { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? AssignedToId { get; set; }
    public decimal? EstimatedHours { get; set; }
}
