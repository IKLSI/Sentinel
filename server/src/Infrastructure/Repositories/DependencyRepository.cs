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

    public async Task<IReadOnlyList<Dependency>> ListCountableByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .AsSplitQuery()
            .Where(d => d.ProjectId == projectId)
            .Select(d => new Dependency
            {
                Status = d.Status,
                IsDeprecated = d.IsDeprecated,
                IsDirect = d.IsDirect,
                Type = d.Type,
                Vulnerabilities = d.Vulnerabilities
                    .Select(v => new Vulnerability { Severity = v.Severity, IsKnownExploited = v.IsKnownExploited })
                    .ToList()
            })
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

    public async Task<IReadOnlyList<DependencyMatchRow>> SearchByNameAsync(Guid organizationId,
        string nameTerm, int take, CancellationToken cancellationToken) =>
        await SearchByName(organizationId, nameTerm, take).ToListAsync(cancellationToken);

    internal IQueryable<DependencyMatchRow> SearchByName(Guid organizationId, string nameTerm, int take)
    {
        string loweredTerm = nameTerm.ToLowerInvariant();

        return Query(QueryTracking.NoTracking)
            .Where(d => d.OrganizationId == organizationId && d.Name.ToLower().Contains(loweredTerm))
            .OrderBy(d => d.ProjectId)
            .ThenByDescending(d => d.Status == DependencyStatus.Vulnerable)
            .ThenByDescending(d => d.IsDirect)
            .ThenBy(d => d.Name)
            .Take(take)
            .Select(d => new DependencyMatchRow(d.ProjectId, d.Name, d.CurrentVersion, d.Ecosystem, d.Status,
                d.IsDirect));
    }
}
