using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IDependencyRepository : ICrudEntityWithIdRepository<Dependency>
{
    IQueryable<Dependency> GetByProject(Guid projectId, QueryableQueryOptions options);

    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}

public interface IVulnerabilityRepository : ICrudEntityWithIdRepository<Vulnerability>
{
    IQueryable<Vulnerability> GetByProject(Guid projectId, QueryableQueryOptions options);

    IQueryable<Vulnerability> GetByOrganization(Guid organizationId, QueryableQueryOptions options);

    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}

public interface IRuntimeRepository : ICrudEntityWithIdRepository<Runtime>
{
    IQueryable<Runtime> GetByProject(Guid projectId, QueryableQueryOptions options);

    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}
