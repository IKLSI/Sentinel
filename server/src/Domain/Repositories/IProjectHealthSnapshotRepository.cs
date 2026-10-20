using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IProjectHealthSnapshotRepository : ICrudEntityWithIdRepository<ProjectHealthSnapshot>
{
    Task<ProjectHealthSnapshot?> GetOrDefaultForDayAsync(Guid projectId, DateOnly day, QueryTracking tracking,
        CancellationToken cancellationToken);
}
