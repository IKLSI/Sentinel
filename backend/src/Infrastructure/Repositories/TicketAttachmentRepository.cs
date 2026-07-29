using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketAttachmentRepository : CrudEntityWithIdRepository<TicketAttachment>, ITicketAttachmentRepository
{
    public TicketAttachmentRepository(SentinelContext context) : base(context) { }

    public Task<TicketAttachment?> GetOrDefaultInTicketAsync(Guid attachmentId, Guid ticketId,
        SingleEntityQueryOptions<TicketAttachment> options, CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId, cancellationToken);
}

public class TicketHistoryRepository : CrudEntityWithIdRepository<TicketHistory>, ITicketHistoryRepository
{
    public TicketHistoryRepository(SentinelContext context) : base(context) { }
}
