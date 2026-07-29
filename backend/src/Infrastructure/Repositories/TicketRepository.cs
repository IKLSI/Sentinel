using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketRepository : CrudEntityWithIdRepository<Ticket>, ITicketRepository
{
    public TicketRepository(SentinelContext context) : base(context) { }

    public IQueryable<Ticket> GetByOrganization(Guid organizationId, QueryableQueryOptions options) =>
        GetAll(options).Where(t => t.OrganizationId == organizationId);

    public IQueryable<Ticket> GetByProjects(IReadOnlyCollection<Guid> projectIds, QueryableQueryOptions options) =>
        GetAll(options).Where(t => t.ProjectId != null && projectIds.Contains(t.ProjectId.Value));

    public Task<bool> ExistsInOrganizationAsync(Guid ticketId, Guid organizationId,
        CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .AnyAsync(t => t.Id == ticketId && t.OrganizationId == organizationId, cancellationToken);

    public Task<int> DeleteInOrganizationAsync(Guid ticketId, Guid organizationId,
        CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .Where(t => t.Id == ticketId && t.OrganizationId == organizationId)
            .ExecuteDeleteAsync(cancellationToken);
}
