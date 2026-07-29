using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketAttachmentRepository : ICrudEntityWithIdRepository<TicketAttachment>
{
    Task<TicketAttachment?> GetOrDefaultInTicketWithTicketAsync(Guid attachmentId, Guid ticketId,
        CancellationToken cancellationToken);
}
