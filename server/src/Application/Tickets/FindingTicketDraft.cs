using Sentinel.Domain.Entities;

namespace Sentinel.Application.Tickets;

public sealed record FindingTicketDraft(
    string Title,
    string Description,
    TicketPriority Priority,
    TicketType Type);
