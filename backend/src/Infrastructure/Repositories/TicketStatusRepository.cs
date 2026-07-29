using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketStatusRepository : CrudEntityWithIdRepository<TicketStatus>, ITicketStatusRepository
{
    public TicketStatusRepository(SentinelContext context) : base(context) { }

    public IQueryable<TicketStatus> GetByOrganization(Guid organizationId, QueryableQueryOptions options) =>
        GetAll(options).Where(s => s.OrganizationId == organizationId);

    public Task<TicketStatus?> GetOrDefaultFirstByOrderAsync(Guid organizationId, CancellationToken cancellationToken) =>
        GetByOrganization(organizationId, QueryableQueryOptions.Tracked)
            .OrderBy(s => s.Order)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExistsForOrganizationAsync(Guid organizationId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly).AnyAsync(s => s.OrganizationId == organizationId, cancellationToken);
}
