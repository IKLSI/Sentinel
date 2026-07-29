using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketAttachmentRepository : ICrudEntityWithIdRepository<TicketAttachment>
{
    Task<TicketAttachment?> GetOrDefaultInTicketAsync(Guid attachmentId, Guid ticketId,
        SingleEntityQueryOptions<TicketAttachment> options, CancellationToken cancellationToken);
}
