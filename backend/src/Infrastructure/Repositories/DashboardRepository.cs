using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Models;
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

    public async Task<IReadOnlyDictionary<TicketStatus, int>> GetTicketCountsByStatusAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);

    public async Task<DashboardCounters?> GetCountersAsync(Guid organizationId, DashboardPeriod period,
        CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .GroupBy(_ => 1)
            .Select(g => new DashboardCounters(
                g.Count(t => OpenStatuses.Contains(t.Status) && t.CreatedAt >= period.WeekAgo),
                g.Count(t => ClosedStatuses.Contains(t.Status) && t.UpdatedAt >= period.MonthStart),
                g.Count(t => ClosedStatuses.Contains(t.Status)
                    && t.UpdatedAt >= period.LastMonthStart && t.UpdatedAt <= period.LastMonthEnd),
                g.Count(t => OpenStatuses.Contains(t.Status) && t.AssignedToId == null)))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<int> CountCriticalVulnerabilitiesAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Vulnerabilities(organizationId)
            .CountAsync(v => v.Severity == VulnerabilitySeverity.Critical, cancellationToken);

    public async Task<IReadOnlyDictionary<TicketPriority, int>> GetOpenTicketCountsByPriorityAsync(
        Guid organizationId, CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => OpenStatuses.Contains(t.Status))
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Priority, x => x.Count, cancellationToken);

    public async Task<IReadOnlyList<UrgentTicketRow>> GetUrgentTicketsAsync(Guid organizationId, int take,
        CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => OpenStatuses.Contains(t.Status))
            .OrderByDescending(t =>
                t.Priority == TicketPriority.Critical ? 4 :
                t.Priority == TicketPriority.High ? 3 :
                t.Priority == TicketPriority.Medium ? 2 : 1)
            .ThenBy(t => t.CreatedAt)
            .Take(take)
            .Select(t => new UrgentTicketRow(
                t.Id,
                t.Title,
                t.Priority.ToString().ToLower(),
                t.Type.ToString().ToLower(),
                t.Status.ToString().ToLower(),
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

    private IQueryable<Ticket> Tickets(Guid organizationId) =>
        _context.Tickets.AsNoTracking().Where(t => t.OrganizationId == organizationId);

    private IQueryable<Vulnerability> Vulnerabilities(Guid organizationId) =>
        _context.Vulnerabilities.AsNoTracking()
            .Where(v => v.Dependency.Project.OrganizationId == organizationId);
}
