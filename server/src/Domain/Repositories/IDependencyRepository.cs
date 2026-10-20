using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IDependencyRepository : ICrudEntityWithIdRepository<Dependency>
{
    Task<IReadOnlyList<Dependency>> ListTrackedByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<int> DeleteByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken);

    Task<IReadOnlyList<PackageMetadataRow>> ListPackageMetadataByProjectAsync(Guid projectId,
        CancellationToken cancellationToken);
}
