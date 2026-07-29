using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketRepository : ICrudEntityWithIdRepository<Ticket>
{
    IQueryable<Ticket> GetByOrganization(Guid organizationId, QueryableQueryOptions options);

    IQueryable<Ticket> GetByProjects(IReadOnlyCollection<Guid> projectIds, QueryableQueryOptions options);

    Task<bool> ExistsInOrganizationAsync(Guid ticketId, Guid organizationId, CancellationToken cancellationToken);

    Task<int> DeleteInOrganizationAsync(Guid ticketId, Guid organizationId, CancellationToken cancellationToken);
}
