using Sentinel.Domain.Entities;

namespace Sentinel.Application.Tickets;

public static class TicketQueries
{
    public static TicketHistory CreateHistory(Guid ticketId, Guid? userId, string field, string? oldValue, string? newValue) =>
        new()
        {
            TicketId = ticketId,
            UserId = userId,
            Field = field,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTime.UtcNow
        };
}
