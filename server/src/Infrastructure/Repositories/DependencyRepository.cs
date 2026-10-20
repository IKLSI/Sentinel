using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class DependencyRepository : CrudEntityWithIdRepository<Dependency>, IDependencyRepository
{
    public DependencyRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<Dependency>> ListTrackedByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.Tracked)
            .Where(d => d.ProjectId == projectId)
            .ToListAsync(cancellationToken);

    public async Task<int> DeleteByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken)
    {
        if (ids.Count == 0) return 0;

        return await Query(QueryTracking.Tracked)
            .Where(d => ids.Contains(d.Id))
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PackageMetadataRow>> ListPackageMetadataByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(d => d.ProjectId == projectId)
            .Select(d => new PackageMetadataRow(d.Ecosystem, d.Name, d.LatestVersion, d.Publisher, d.License,
                d.IsDeprecated))
            .ToListAsync(cancellationToken);
}
