using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketStatusRepository : ICrudEntityWithIdRepository<TicketStatus>
{
    IQueryable<TicketStatus> GetByOrganization(Guid organizationId, QueryableQueryOptions options);

    Task<TicketStatus?> GetOrDefaultFirstByOrderAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<bool> ExistsForOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);
}
