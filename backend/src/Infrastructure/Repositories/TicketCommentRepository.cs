using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketCommentRepository : CrudEntityWithIdRepository<TicketComment>, ITicketCommentRepository
{
    public TicketCommentRepository(SentinelContext context) : base(context) { }

    public Task<TicketComment?> GetOrDefaultInTicketAsync(Guid commentId, Guid ticketId,
        SingleEntityQueryOptions<TicketComment> options, CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == ticketId, cancellationToken);

    public IQueryable<TicketComment> GetByTicket(Guid ticketId, QueryableQueryOptions options) =>
        GetAll(options).Where(c => c.TicketId == ticketId);
}
