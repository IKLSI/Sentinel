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
}
