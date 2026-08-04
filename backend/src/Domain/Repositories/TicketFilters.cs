using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record TicketFilter
{
    public TicketPriority? Priority { get; init; }
    public TicketStatus? Status { get; init; }
    public Guid? AssignedToId { get; init; }
    public TicketType? Type { get; init; }
    public string? Search { get; init; }
}
