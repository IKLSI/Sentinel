using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketAttachmentRepository : CrudEntityWithIdRepository<TicketAttachment>, ITicketAttachmentRepository
{
    public TicketAttachmentRepository(SentinelContext context) : base(context) { }

    public Task<TicketAttachment?> GetOrDefaultInTicketWithTicketAsync(Guid attachmentId, Guid ticketId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Include(a => a.Ticket)
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId, cancellationToken);

    public Task<byte[]?> GetContentForUserOrDefaultAsync(Guid attachmentId, Guid userId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(a => a.Id == attachmentId && a.UploadedById == userId)
            .Select(a => a.Content)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<UserExportTicketAttachmentRow>> ListForUserDataExportAsync(Guid userId, int take,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(a => a.UploadedById == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(take)
            .Select(a => new UserExportTicketAttachmentRow(
                a.Id,
                a.TicketId,
                a.Ticket.Number,
                a.FileName,
                a.ContentType,
                a.CreatedAt))
            .ToListAsync(cancellationToken);
}
