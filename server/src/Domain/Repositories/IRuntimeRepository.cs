using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IRuntimeRepository : ICrudEntityWithIdRepository<Runtime>
{
    Task<IReadOnlyList<Runtime>> ListTrackedByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<int> DeleteByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken);

    Task<IReadOnlyList<RuntimeLifecycleRow>> ListLifecycleByProjectAsync(Guid projectId,
        CancellationToken cancellationToken);
}
