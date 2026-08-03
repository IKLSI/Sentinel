using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class DependencyRepository : CrudEntityWithIdRepository<Dependency>, IDependencyRepository
{
    public DependencyRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<Dependency>> ListByProjectWithVulnerabilitiesAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(d => d.ProjectId == projectId)
            .Include(d => d.Vulnerabilities)
            .ToListAsync(cancellationToken);

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(d => d.ProjectId == projectId)
            .ExecuteDeleteAsync(cancellationToken);
}

public class VulnerabilityRepository : CrudEntityWithIdRepository<Vulnerability>, IVulnerabilityRepository
{
    public VulnerabilityRepository(SentinelContext context) : base(context) { }

    public Task<HashSet<string>> GetCveIdsByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(v => v.Dependency.ProjectId == projectId)
            .Select(v => v.CveId)
            .ToHashSetAsync(cancellationToken);

    public Task<Dictionary<string, DateTime>> GetFirstDetectionsByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(v => v.Dependency.ProjectId == projectId)
            .GroupBy(v => v.CveId)
            .Select(g => new { CveId = g.Key, DetectedAt = g.Min(v => v.DetectedAt) })
            .ToDictionaryAsync(x => x.CveId, x => x.DetectedAt, cancellationToken);

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(v => v.Dependency.ProjectId == projectId)
            .ExecuteDeleteAsync(cancellationToken);
}

public class RuntimeRepository : CrudEntityWithIdRepository<Runtime>, IRuntimeRepository
{
    public RuntimeRepository(SentinelContext context) : base(context) { }

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(r => r.ProjectId == projectId)
            .ExecuteDeleteAsync(cancellationToken);
}
