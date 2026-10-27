using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketAttachmentRepository : CrudEntityWithIdRepository<TicketAttachment>, ITicketAttachmentRepository
{
    public TicketAttachmentRepository(SentinelContext context) : base(context) { }

    public Task<TicketAttachment?> GetOrDefaultInTicketAsync(Guid attachmentId, Guid ticketId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId, cancellationToken);

    public async Task<IReadOnlyList<UserExportAttachmentContentRow>> ListContentsForUserAsync(
        IReadOnlyCollection<Guid> attachmentIds, Guid userId, CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(a => attachmentIds.Contains(a.Id) && a.UploadedById == userId && a.Content != null)
            .Select(a => new UserExportAttachmentContentRow(a.Id, a.Content!))
            .ToListAsync(cancellationToken);

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
                a.ContentLength,
                a.CreatedAt))
            .ToListAsync(cancellationToken);
}
