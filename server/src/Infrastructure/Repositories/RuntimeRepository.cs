using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class RuntimeRepository : CrudEntityWithIdRepository<Runtime>, IRuntimeRepository
{
    public RuntimeRepository(SentinelContext context) : base(context) { }

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(r => r.ProjectId == projectId)
            .ExecuteDeleteAsync(cancellationToken);

    public async Task<IReadOnlyList<RuntimeLifecycleRow>> ListLifecycleByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(r => r.ProjectId == projectId)
            .Select(r => new RuntimeLifecycleRow(r.Name, r.Version, r.IsEol, r.EolDate))
            .ToListAsync(cancellationToken);
}
