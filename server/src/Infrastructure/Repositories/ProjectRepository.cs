using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;
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

    public Task<Project?> GetOrDefaultInOrganizationForFindingAsync(Guid projectId, Guid organizationId,
        FindingKind kind, string findingKey, CancellationToken cancellationToken)
    {
        IQueryable<Project> query = Query(QueryTracking.NoTracking).AsSplitQuery();

        query = kind switch
        {
            FindingKind.Vulnerability => WithAdvisory(query, FindingKeys.AdvisoryOf(findingKey)),
            FindingKind.OutdatedDependency => WithPackage(query, FindingKeys.PackageOf(findingKey)),
            _ => query.Include(p => p.Runtimes)
        };

        return query.FirstOrDefaultAsync(p => p.Id == projectId && p.OrganizationId == organizationId,
            cancellationToken);
    }

    private static IQueryable<Project> WithAdvisory(IQueryable<Project> query, string advisoryId) =>
        query.Include(p => p.Dependencies
                .Where(d => d.Vulnerabilities.Any(v => v.CveId.ToLower() == advisoryId)))
            .ThenInclude(d => d.Vulnerabilities.Where(v => v.CveId.ToLower() == advisoryId));

    private static IQueryable<Project> WithPackage(IQueryable<Project> query, string packageName) =>
        query.Include(p => p.Dependencies.Where(d => d.Name.ToLower() == packageName));

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
                project.Branch,
                project.RootPath,
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

    public async Task<IReadOnlyList<Project>> ListScoringGraphsByIdsAsync(Guid organizationId,
        IReadOnlyCollection<Guid> projectIds, CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .AsSplitQuery()
            .Where(p => p.OrganizationId == organizationId && projectIds.Contains(p.Id))
            .Select(p => new Project
            {
                Id = p.Id,
                OrganizationId = p.OrganizationId,
                Name = p.Name,
                RepositoryType = p.RepositoryType,
                LastScanAt = p.LastScanAt,
                LastScanError = p.LastScanError,
                HealthScore = p.HealthScore,
                HealthGrade = p.HealthGrade,
                Coverage = p.Coverage,
                Dependencies = p.Dependencies.Select(d => new Dependency
                {
                    Id = d.Id,
                    ProjectId = d.ProjectId,
                    Name = d.Name,
                    CurrentVersion = d.CurrentVersion,
                    LatestVersion = d.LatestVersion,
                    IsDeprecated = d.IsDeprecated,
                    IsVersionPinned = d.IsVersionPinned,
                    Type = d.Type,
                    IsDirect = d.IsDirect,
                    Ecosystem = d.Ecosystem,
                    Status = d.Status,
                    Vulnerabilities = d.Vulnerabilities.Select(v => new Vulnerability
                    {
                        Id = v.Id,
                        DependencyId = v.DependencyId,
                        CveId = v.CveId,
                        CveAlias = v.CveAlias,
                        CvssScore = v.CvssScore,
                        PackageName = v.PackageName,
                        FixedVersion = v.FixedVersion,
                        Severity = v.Severity,
                        DetectedAt = v.DetectedAt,
                        EpssScore = v.EpssScore,
                        EpssPercentile = v.EpssPercentile,
                        IsKnownExploited = v.IsKnownExploited
                    }).ToList()
                }).ToList(),
                Runtimes = p.Runtimes.Select(r => new Runtime
                {
                    Id = r.Id,
                    ProjectId = r.ProjectId,
                    Name = r.Name,
                    Version = r.Version,
                    EolDate = r.EolDate,
                    IsEol = r.IsEol,
                    IsMinimumConstraint = r.IsMinimumConstraint
                }).ToList()
            })
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<string?>> ListRepositoryUrlsAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(p => p.OrganizationId == organizationId)
            .Select(p => p.RepositoryUrl)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Guid>> ListIdsByOrganizationAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(p => p.OrganizationId == organizationId)
            .Select(p => p.Id)
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
