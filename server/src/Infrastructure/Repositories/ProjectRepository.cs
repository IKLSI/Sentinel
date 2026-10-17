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

    public async Task<IReadOnlyList<ProjectSummaryRow>> ListSummariesByHealthRankAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await SummariesByHealthRank(organizationId).ToListAsync(cancellationToken);

    internal IQueryable<ProjectSummaryRow> SummariesByHealthRank(Guid organizationId)
    {
        IQueryable<ProjectVulnerabilityStats> vulnerabilityStats =
            from vulnerability in Context.Vulnerabilities
            join dependency in Context.Dependencies on vulnerability.DependencyId equals dependency.Id
            group vulnerability by dependency.ProjectId into perProject
            select new ProjectVulnerabilityStats
            {
                ProjectId = perProject.Key,
                Critical = perProject.Count(v => v.Severity == VulnerabilitySeverity.Critical),
                Total = perProject.Count(),
                KnownExploited = perProject.Count(v => v.IsKnownExploited)
            };

        IQueryable<ProjectCount> dependencyCounts =
            from dependency in Context.Dependencies
            group dependency by dependency.ProjectId into perProject
            select new ProjectCount { ProjectId = perProject.Key, Total = perProject.Count() };

        IQueryable<ProjectCount> ticketCounts =
            from ticket in Context.Tickets
            where ticket.ProjectId != null
            group ticket by ticket.ProjectId!.Value into perProject
            select new ProjectCount { ProjectId = perProject.Key, Total = perProject.Count() };

        return
            from project in Query(QueryTracking.NoTracking)
            where project.OrganizationId == organizationId
            join stats in vulnerabilityStats on project.Id equals stats.ProjectId into statsGroup
            from stats in statsGroup.DefaultIfEmpty()
            join dependencies in dependencyCounts on project.Id equals dependencies.ProjectId into dependencyGroup
            from dependencies in dependencyGroup.DefaultIfEmpty()
            join tickets in ticketCounts on project.Id equals tickets.ProjectId into ticketGroup
            from tickets in ticketGroup.DefaultIfEmpty()
            orderby ((int?)stats.Critical ?? 0) > 0 descending,
                project.Coverage == ScanCoverage.Covered ? 0 : 1,
                project.HealthScore,
                project.Name
            select new ProjectSummaryRow(
                project.Id,
                project.Name,
                project.RepositoryUrl,
                project.RepositoryType,
                project.LastScanAt,
                project.LastScanError,
                project.HealthScore,
                project.HealthGrade,
                project.Coverage,
                project.ScanFrequency,
                (int?)dependencies.Total ?? 0,
                (int?)stats.Critical ?? 0,
                (int?)stats.Total ?? 0,
                (int?)stats.KnownExploited ?? 0,
                (int?)tickets.Total ?? 0);
    }

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

    public Task<int> MarkScanFailedAsync(Guid projectId, string errorCode, DateTime scannedAt,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(p => p.Id == projectId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.LastScanAt, scannedAt)
                .SetProperty(p => p.LastScanError, errorCode), cancellationToken);

    public async Task<IReadOnlyList<ProjectOptionRow>> ListOptionsByNameAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(p => p.OrganizationId == organizationId)
            .OrderBy(p => p.Name)
            .Select(p => new ProjectOptionRow(p.Id, p.Name))
            .ToListAsync(cancellationToken);

    private static IQueryable<Project> WithHealthDetails(IQueryable<Project> query) => query
        .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
        .Include(p => p.Runtimes);

    private sealed class ProjectVulnerabilityStats
    {
        public Guid ProjectId { get; init; }
        public int Critical { get; init; }
        public int Total { get; init; }
        public int KnownExploited { get; init; }
    }

    private sealed class ProjectCount
    {
        public Guid ProjectId { get; init; }
        public int Total { get; init; }
    }
}
