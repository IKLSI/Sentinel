using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketCommentRepository : ICrudEntityWithIdRepository<TicketComment>
{
    Task<TicketComment?> GetOrDefaultInTicketAsync(Guid commentId, Guid ticketId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<TicketComment?> GetOrDefaultInTicketWithAuthorAsync(Guid commentId, Guid ticketId,
        CancellationToken cancellationToken);
}
