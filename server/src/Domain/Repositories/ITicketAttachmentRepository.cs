using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface ITicketAttachmentRepository : ICrudEntityWithIdRepository<TicketAttachment>
{
    Task<TicketAttachment?> GetOrDefaultInTicketWithTicketAsync(Guid attachmentId, Guid ticketId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<UserExportTicketAttachmentRow>> ListForUserDataExportAsync(Guid userId, int take,
        CancellationToken cancellationToken);

    Task<byte[]?> GetContentForUserOrDefaultAsync(Guid attachmentId, Guid userId,
        CancellationToken cancellationToken);
}
