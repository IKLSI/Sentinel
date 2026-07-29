using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketCommentRepository : ICrudEntityWithIdRepository<TicketComment>
{
    Task<TicketComment?> GetOrDefaultInTicketAsync(Guid commentId, Guid ticketId,
        SingleEntityQueryOptions<TicketComment> options, CancellationToken cancellationToken);

    IQueryable<TicketComment> GetByTicket(Guid ticketId, QueryableQueryOptions options);
}
