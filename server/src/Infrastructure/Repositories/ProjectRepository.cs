using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class ProjectRepository : CrudEntityWithIdRepository<Project>, IProjectRepository
{
    public ProjectRepository(SentinelContext context) : base(context) { }

    public Task<Project?> GetOrDefaultInOrganizationAsync(Guid projectId, Guid organizationId,
        QueryTracking tracking, CancellationToken cancellationToken) =>
        Query(tracking)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OrganizationId == organizationId, cancellationToken);

    public Task<Project?> GetOrDefaultWithHealthDetailsAsync(Guid projectId, QueryTracking tracking,
        CancellationToken cancellationToken)
    {
        IQueryable<Project> query = Query(tracking).AsSplitQuery();

        return WithHealthDetails(query).FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);
    }

    public Task<Project?> GetOrDefaultInOrganizationWithHealthDetailsAsync(Guid projectId, Guid organizationId,
        CancellationToken cancellationToken) =>
        WithHealthDetails(Query(QueryTracking.NoTracking).AsSplitQuery())
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OrganizationId == organizationId, cancellationToken);

    public Task<Project?> GetOrDefaultInOrganizationWithDependenciesAsync(Guid projectId, Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AsSplitQuery()
            .Include(p => p.Dependencies)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OrganizationId == organizationId, cancellationToken);

    public async Task<IReadOnlyList<Project>> ListWithHealthDetailsByHealthRankAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await WithHealthDetails(Query(QueryTracking.NoTracking).AsSplitQuery())
            .Where(p => p.OrganizationId == organizationId)
            .OrderByDescending(p => p.Dependencies.Any(d =>
                d.Vulnerabilities.Any(v => v.Severity == VulnerabilitySeverity.Critical)))
            .ThenBy(p => p.Coverage == ScanCoverage.Covered ? 0 : 1)
            .ThenBy(p => p.HealthScore)
            .ThenBy(p => p.Name)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Project>> ListWithHealthDetailsByNameAsync(Guid organizationId, int take,
        CancellationToken cancellationToken) =>
        await WithHealthDetails(Query(QueryTracking.NoTracking).AsSplitQuery())
            .Where(p => p.OrganizationId == organizationId)
            .OrderBy(p => p.Name)
            .Take(take)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<string?>> ListRepositoryUrlsAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(p => p.OrganizationId == organizationId)
            .Select(p => p.RepositoryUrl)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Guid>> ListIdsDueForScanAsync(ScanFrequency frequency, DateTime threshold,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(p => p.ScanFrequency == frequency && (p.LastScanAt == null || p.LastScanAt < threshold))
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

    public Task<bool> ExistsInOrganizationAsync(Guid projectId, Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AnyAsync(p => p.Id == projectId && p.OrganizationId == organizationId, cancellationToken);

    public Task<int> CountByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking).CountAsync(p => p.OrganizationId == organizationId, cancellationToken);

    public Task<int> ClampScanFrequencyAsync(Guid organizationId, IReadOnlyCollection<ScanFrequency> tooFrequent,
        ScanFrequency maxFrequency, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(p => p.OrganizationId == organizationId && tooFrequent.Contains(p.ScanFrequency))
            .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.ScanFrequency, maxFrequency),
                cancellationToken);

    private static IQueryable<Project> WithHealthDetails(IQueryable<Project> query) => query
        .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
        .Include(p => p.Runtimes);
}
