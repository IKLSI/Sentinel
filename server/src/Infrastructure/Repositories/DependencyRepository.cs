using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class DependencyRepository : CrudEntityWithIdRepository<Dependency>, IDependencyRepository
{
    public DependencyRepository(SentinelContext context) : base(context) { }

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(d => d.ProjectId == projectId)
            .ExecuteDeleteAsync(cancellationToken);

    public async Task<IReadOnlyList<PackageMetadataRow>> ListPackageMetadataByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(d => d.ProjectId == projectId)
            .Select(d => new PackageMetadataRow(d.Ecosystem, d.Name, d.LatestVersion, d.Publisher, d.License,
                d.IsDeprecated))
            .ToListAsync(cancellationToken);
}
