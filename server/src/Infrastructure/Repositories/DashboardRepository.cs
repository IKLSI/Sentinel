using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly SentinelContext _context;

    public DashboardRepository(SentinelContext context)
    {
        _context = context;
    }

    private static readonly TicketStatus[] OpenStatuses = TicketStatusRules.Open.ToArray();
    private static readonly TicketStatus[] ClosedStatuses = TicketStatusRules.Closed.ToArray();

    public async Task<IReadOnlyList<UrgentTicketRow>> GetUrgentTicketsAsync(Guid organizationId, int take,
        CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => OpenStatuses.Contains(t.Status))
            .OrderByDescending(t => t.PriorityRank)
            .ThenBy(t => t.CreatedAt)
            .Take(take)
            .Select(t => new UrgentTicketRow(
                t.Id,
                t.Number,
                t.Title,
                t.Priority.ToString().ToLower(),
                t.Type.ToString().ToLower(),
                t.Project != null ? t.Project.Name : null,
                t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
                t.Comments.Count))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ClosedTicketActivityRow>> GetClosedTicketActivityAsync(Guid organizationId,
        DateTime since, int take, CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => ClosedStatuses.Contains(t.Status) && t.UpdatedAt >= since)
            .OrderByDescending(t => t.UpdatedAt)
            .Take(take)
            .Select(t => new ClosedTicketActivityRow(
                t.Id,
                t.Number,
                t.UpdatedAt,
                t.ProjectId,
                t.Project != null ? t.Project.Name : null,
                t.AssignedTo != null ? t.AssignedTo.FirstName : null,
                t.AssignedTo != null ? t.AssignedTo.LastName : null,
                t.CreatedBy != null ? t.CreatedBy.FirstName : null,
                t.CreatedBy != null ? t.CreatedBy.LastName : null))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<CreatedTicketActivityRow>> GetCreatedTicketActivityAsync(Guid organizationId,
        DateTime since, int take, CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => t.CreatedAt >= since)
            .OrderByDescending(t => t.CreatedAt)
            .Take(take)
            .Select(t => new CreatedTicketActivityRow(
                t.Id,
                t.Number,
                t.CreatedAt,
                t.ProjectId,
                t.Project != null ? t.Project.Name : null,
                t.CreatedBy != null ? t.CreatedBy.FirstName : null,
                t.CreatedBy != null ? t.CreatedBy.LastName : null))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<VulnerabilityActivityRow>> GetCriticalVulnerabilityActivityAsync(
        Guid organizationId, DateTime since, CancellationToken cancellationToken) =>
        await Vulnerabilities(organizationId)
            .Where(v => v.Severity == VulnerabilitySeverity.Critical && v.DetectedAt >= since)
            .Select(v => new VulnerabilityActivityRow(
                v.DetectedAt,
                v.CveId,
                v.CvssScore,
                v.Dependency.Project.Name,
                v.Dependency.Project.Id))
            .ToListAsync(cancellationToken);

    public async Task<VulnerabilityFlowCountsRow> GetVulnerabilityFlowCountsAsync(Guid organizationId,
        DateTime windowStart, CancellationToken cancellationToken)
    {
        IQueryable<FlowCount> opened = Vulnerabilities(organizationId)
            .Where(v => v.DetectedAt >= windowStart)
            .GroupBy(v => v.DetectedAt.Date)
            .Select(g => new FlowCount { Kind = FlowKind.Opened, Date = g.Key, Count = g.Count() });

        IQueryable<FlowCount> resolvedDetections = Resolutions(organizationId)
            .Where(r => r.DetectedAt >= windowStart)
            .GroupBy(r => r.DetectedAt.Date)
            .Select(g => new FlowCount { Kind = FlowKind.ResolvedDetection, Date = g.Key, Count = g.Count() });

        IQueryable<FlowCount> resolutions = Resolutions(organizationId)
            .Where(r => r.ResolvedAt >= windowStart)
            .GroupBy(r => r.ResolvedAt.Date)
            .Select(g => new FlowCount { Kind = FlowKind.Resolution, Date = g.Key, Count = g.Count() });

        List<FlowCount> counts = await opened.Concat(resolvedDetections).Concat(resolutions)
            .ToListAsync(cancellationToken);

        return new VulnerabilityFlowCountsRow(
            CountsOf(counts, FlowKind.Opened),
            CountsOf(counts, FlowKind.ResolvedDetection),
            CountsOf(counts, FlowKind.Resolution));
    }

    private static Dictionary<DateTime, int> CountsOf(List<FlowCount> counts, int kind) =>
        counts.Where(count => count.Kind == kind).ToDictionary(count => count.Date, count => count.Count);

    public async Task<IReadOnlyList<ScoreSnapshotRow>> GetScoreSnapshotsAsync(Guid organizationId,
        DateOnly windowStart, CancellationToken cancellationToken)
    {
        IQueryable<ProjectHealthSnapshot> snapshots = Snapshots(organizationId);

        IQueryable<ProjectDay> latestDaysBeforeWindow = snapshots
            .Where(s => s.Day < windowStart)
            .GroupBy(s => s.ProjectId)
            .Select(g => new ProjectDay { ProjectId = g.Key, Day = g.Max(s => s.Day) });

        IQueryable<ProjectDayScore> carriedOver =
            from snapshot in snapshots
            join latest in latestDaysBeforeWindow
                on new { snapshot.ProjectId, snapshot.Day } equals new { latest.ProjectId, latest.Day }
            select new ProjectDayScore { ProjectId = snapshot.ProjectId, Day = snapshot.Day, Score = snapshot.Score };

        IQueryable<ProjectDayScore> inWindow = snapshots
            .Where(s => s.Day >= windowStart)
            .Select(s => new ProjectDayScore { ProjectId = s.ProjectId, Day = s.Day, Score = s.Score });

        List<ProjectDayScore> rows = await carriedOver.Concat(inWindow).ToListAsync(cancellationToken);

        return rows.Select(row => new ScoreSnapshotRow(row.ProjectId, row.Day, row.Score)).ToList();
    }

    public async Task<IReadOnlyList<OpenTicketRow>> GetOpenTicketsAsync(Guid organizationId,
        IReadOnlyCollection<Guid> projectIds, CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => OpenStatuses.Contains(t.Status) && projectIds.Contains(t.ProjectId!.Value))
            .Select(t => new OpenTicketRow(
                t.Id,
                t.Number,
                t.ProjectId,
                t.Priority,
                t.AssignedToId != null,
                t.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<DashboardProjectRow>> GetProjectsAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await _context.Projects.AsNoTracking()
            .Where(p => p.OrganizationId == organizationId)
            .Select(p => new DashboardProjectRow(
                p.Id,
                p.Name,
                p.RepositoryType,
                p.LastScanAt,
                p.Coverage,
                p.LastScanError,
                p.HealthScore,
                p.HealthGrade,
                p.InventoryCounts))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<DashboardRuntimeRow>> GetRuntimesAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await _context.Runtimes.AsNoTracking()
            .Where(r => r.OrganizationId == organizationId)
            .Select(r => new DashboardRuntimeRow(r.ProjectId, r.Name, r.Version, r.EolDate, r.IsEol,
                r.IsMinimumConstraint))
            .ToListAsync(cancellationToken);

    private IQueryable<Ticket> Tickets(Guid organizationId) =>
        _context.Tickets.AsNoTracking().Where(t => t.OrganizationId == organizationId);

    private IQueryable<Vulnerability> Vulnerabilities(Guid organizationId) =>
        _context.Vulnerabilities.AsNoTracking()
            .Where(v => v.OrganizationId == organizationId);

    private IQueryable<VulnerabilityResolution> Resolutions(Guid organizationId) =>
        _context.VulnerabilityResolutions.AsNoTracking().Where(r => r.OrganizationId == organizationId);

    private IQueryable<ProjectHealthSnapshot> Snapshots(Guid organizationId) =>
        _context.ProjectHealthSnapshots.AsNoTracking().Where(s => s.OrganizationId == organizationId);

    private sealed class ProjectDay
    {
        public Guid ProjectId { get; init; }
        public DateOnly Day { get; init; }
    }

    private sealed class ProjectDayScore
    {
        public Guid ProjectId { get; init; }
        public DateOnly Day { get; init; }
        public int Score { get; init; }
    }

    private static class FlowKind
    {
        public const int Opened = 0;
        public const int ResolvedDetection = 1;
        public const int Resolution = 2;
    }

    private sealed class FlowCount
    {
        public int Kind { get; init; }
        public DateTime Date { get; init; }
        public int Count { get; init; }
    }
}
