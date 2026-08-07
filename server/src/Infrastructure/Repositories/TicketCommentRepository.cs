using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketCommentRepository : CrudEntityWithIdRepository<TicketComment>, ITicketCommentRepository
{
    public TicketCommentRepository(SentinelContext context) : base(context) { }

    public Task<TicketComment?> GetOrDefaultInTicketAsync(Guid commentId, Guid ticketId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == ticketId, cancellationToken);

    public Task<TicketComment?> GetOrDefaultInTicketWithAuthorAsync(Guid commentId, Guid ticketId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Include(c => c.Author)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == ticketId, cancellationToken);

    public async Task<IReadOnlyList<UserExportTicketCommentRow>> ListForUserDataExportAsync(Guid userId, int take,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(c => c.AuthorId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(take)
            .Select(c => new UserExportTicketCommentRow(
                c.Id,
                c.TicketId,
                c.Ticket.Number,
                c.Content,
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(cancellationToken);
}
