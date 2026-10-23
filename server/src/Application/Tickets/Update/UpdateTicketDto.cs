using Sentinel.Application.Common.Contracts;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Tickets.Update;

public class UpdateTicketDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketType? Type { get; set; }
    public Guid? ProjectId { get; set; }
    public bool ClearProject { get; set; }
    public Guid? AssignedToId { get; set; }
    public bool ClearAssignee { get; set; }
    [EnumValues(typeof(TicketStatus), lowercase: true)]
    public string? Status { get; set; }
}
