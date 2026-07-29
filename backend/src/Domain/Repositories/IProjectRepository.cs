using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IProjectRepository : ICrudEntityWithIdRepository<Project>
{
    IQueryable<Project> GetByOrganization(Guid organizationId, QueryableQueryOptions options);

    Task<Project?> GetOrDefaultInOrganizationAsync(Guid projectId, Guid organizationId,
        SingleEntityQueryOptions<Project> options, CancellationToken cancellationToken);

    Task<bool> ExistsInOrganizationAsync(Guid projectId, Guid organizationId, CancellationToken cancellationToken);

    Task<int> CountByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);
}
