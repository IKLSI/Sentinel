using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IRuntimeRepository : ICrudEntityWithIdRepository<Runtime>
{
    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<IReadOnlyList<RuntimeLifecycleRow>> ListLifecycleByProjectAsync(Guid projectId,
        CancellationToken cancellationToken);
}
