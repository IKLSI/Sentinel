using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IDependencyRepository : ICrudEntityWithIdRepository<Dependency>
{
    Task<IReadOnlyList<Dependency>> ListByProjectWithVulnerabilitiesAsync(Guid projectId,
        CancellationToken cancellationToken);

    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}

public interface IVulnerabilityRepository : ICrudEntityWithIdRepository<Vulnerability>
{
    Task<HashSet<string>> GetCveIdsByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<Dictionary<string, DateTime>> GetFirstDetectionsByProjectAsync(Guid projectId,
        CancellationToken cancellationToken);

    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}

public interface IRuntimeRepository : ICrudEntityWithIdRepository<Runtime>
{
    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}
