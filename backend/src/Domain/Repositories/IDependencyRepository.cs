using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IDependencyRepository : ICrudEntityWithIdRepository<Dependency>
{
    Task<IReadOnlyList<Dependency>> ListByProjectWithVulnerabilitiesAsync(Guid projectId,
        CancellationToken cancellationToken);

    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}
