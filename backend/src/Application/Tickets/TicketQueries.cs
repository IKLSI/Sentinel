using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Tickets;

public static class TicketQueries
{
    public static SingleEntityQueryOptions<Ticket> Details => new()
    {
        AsNoTracking = true,
        AsSplitQuery = true,
        Include = query => query
            .Include(t => t.TicketStatus)
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .Include(t => t.History).ThenInclude(h => h.User)
    };

    public static IQueryable<Ticket> WithGridIncludes(IQueryable<Ticket> query) => query
        .Include(t => t.TicketStatus)
        .Include(t => t.Project)
        .Include(t => t.AssignedTo)
        .Include(t => t.CreatedBy);

    public static TicketHistory CreateHistory(Guid ticketId, Guid userId, string field, string? oldValue, string? newValue) =>
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
