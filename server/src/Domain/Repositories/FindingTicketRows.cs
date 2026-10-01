using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record FindingTicketRow(
    FindingKind Kind,
    string Key,
    Guid TicketId,
    int Number,
    TicketStatus Status,
    DateTime CreatedAt);
