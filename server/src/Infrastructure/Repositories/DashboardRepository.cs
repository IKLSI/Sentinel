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

    public async Task<IReadOnlyDictionary<DateTime, int>> GetVulnerabilityDetectionCountsAsync(Guid organizationId,
        DateTime windowStart, CancellationToken cancellationToken) =>
        await Vulnerabilities(organizationId)
            .Where(v => v.DetectedAt >= windowStart)
            .GroupBy(v => v.DetectedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, cancellationToken);

    public async Task<IReadOnlyDictionary<DateTime, int>> GetResolvedVulnerabilityDetectionCountsAsync(
        Guid organizationId, DateTime windowStart, CancellationToken cancellationToken) =>
        await Resolutions(organizationId)
            .Where(r => r.DetectedAt >= windowStart)
            .GroupBy(r => r.DetectedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, cancellationToken);

    public async Task<IReadOnlyDictionary<DateTime, int>> GetVulnerabilityResolutionCountsAsync(Guid organizationId,
        DateTime windowStart, CancellationToken cancellationToken) =>
        await Resolutions(organizationId)
            .Where(r => r.ResolvedAt >= windowStart)
            .GroupBy(r => r.ResolvedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, cancellationToken);

    public async Task<IReadOnlyList<ScoreSnapshotRow>> GetScoreSnapshotsAsync(Guid organizationId,
        DateOnly windowStart, CancellationToken cancellationToken)
    {
        IQueryable<ProjectHealthSnapshot> snapshots = Snapshots(organizationId);

        List<ScoreSnapshotRow> inWindow = await snapshots
            .Where(s => s.Day >= windowStart)
            .Select(s => new ScoreSnapshotRow(s.ProjectId, s.Day, s.Score))
            .ToListAsync(cancellationToken);

        IQueryable<ProjectDay> latestDaysBeforeWindow = snapshots
            .Where(s => s.Day < windowStart)
            .GroupBy(s => s.ProjectId)
            .Select(g => new ProjectDay { ProjectId = g.Key, Day = g.Max(s => s.Day) });

        List<ScoreSnapshotRow> carriedOver = await (
                from snapshot in snapshots
                join latest in latestDaysBeforeWindow
                    on new { snapshot.ProjectId, snapshot.Day } equals new { latest.ProjectId, latest.Day }
                select new ScoreSnapshotRow(snapshot.ProjectId, snapshot.Day, snapshot.Score))
            .ToListAsync(cancellationToken);

        return [.. carriedOver, .. inWindow];
    }

    public async Task<IReadOnlyList<OpenTicketRow>> GetOpenTicketsAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => OpenStatuses.Contains(t.Status))
            .Select(t => new OpenTicketRow(
                t.Id,
                t.Number,
                t.ProjectId,
                t.Priority,
                t.AssignedToId != null,
                t.CreatedAt))
            .ToListAsync(cancellationToken);

    private IQueryable<Ticket> Tickets(Guid organizationId) =>
        _context.Tickets.AsNoTracking().Where(t => t.OrganizationId == organizationId);

    private IQueryable<Vulnerability> Vulnerabilities(Guid organizationId) =>
        _context.Vulnerabilities.AsNoTracking()
            .Where(v => v.Dependency.Project.OrganizationId == organizationId);

    private IQueryable<VulnerabilityResolution> Resolutions(Guid organizationId) =>
        _context.VulnerabilityResolutions.AsNoTracking().Where(r => r.OrganizationId == organizationId);

    private IQueryable<ProjectHealthSnapshot> Snapshots(Guid organizationId) =>
        _context.ProjectHealthSnapshots.AsNoTracking().Where(s => s.OrganizationId == organizationId);

    private sealed class ProjectDay
    {
        public Guid ProjectId { get; init; }
        public DateOnly Day { get; init; }
    }
}
