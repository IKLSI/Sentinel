using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class RuntimeRepository : CrudEntityWithIdRepository<Runtime>, IRuntimeRepository
{
    public RuntimeRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<Runtime>> ListTrackedByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.Tracked)
            .Where(r => r.ProjectId == projectId)
            .ToListAsync(cancellationToken);

    public async Task<int> DeleteByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken)
    {
        if (ids.Count == 0) return 0;

        return await Query(QueryTracking.Tracked)
            .Where(r => ids.Contains(r.Id))
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RuntimeLifecycleRow>> ListLifecycleByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(r => r.ProjectId == projectId)
            .Select(r => new RuntimeLifecycleRow(r.Name, r.Version, r.IsEol, r.EolDate))
            .ToListAsync(cancellationToken);
}
