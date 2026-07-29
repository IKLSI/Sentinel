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

    public async Task<IReadOnlyDictionary<Guid, int>> GetTicketCountsByStatusAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await StatusedTickets(organizationId)
            .GroupBy(t => t.TicketStatusId!.Value)
            .Select(g => new { StatusId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StatusId, x => x.Count, cancellationToken);

    public async Task<DashboardCounters?> GetCountersAsync(Guid organizationId,
        IReadOnlyCollection<Guid> openStatusIds, IReadOnlyCollection<Guid> closedStatusIds, DashboardPeriod period,
        CancellationToken cancellationToken)
    {
        List<Guid> openIds = openStatusIds.ToList();
        List<Guid> closedIds = closedStatusIds.ToList();

        return await StatusedTickets(organizationId)
            .GroupBy(_ => 1)
            .Select(g => new DashboardCounters(
                g.Count(t => openIds.Contains(t.TicketStatusId!.Value) && t.CreatedAt >= period.WeekAgo),
                g.Count(t => closedIds.Contains(t.TicketStatusId!.Value) && t.UpdatedAt >= period.MonthStart),
                g.Count(t => closedIds.Contains(t.TicketStatusId!.Value)
                    && t.UpdatedAt >= period.LastMonthStart && t.UpdatedAt <= period.LastMonthEnd),
                g.Count(t => openIds.Contains(t.TicketStatusId!.Value) && t.AssignedToId == null)))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public Task<int> CountCriticalVulnerabilitiesAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Vulnerabilities(organizationId)
            .CountAsync(v => v.Severity == VulnerabilitySeverity.Critical, cancellationToken);

    public async Task<IReadOnlyDictionary<TicketPriority, int>> GetOpenTicketCountsByPriorityAsync(
        Guid organizationId, IReadOnlyCollection<Guid> openStatusIds, CancellationToken cancellationToken)
    {
        List<Guid> openIds = openStatusIds.ToList();

        return await StatusedTickets(organizationId)
            .Where(t => openIds.Contains(t.TicketStatusId!.Value))
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Priority, x => x.Count, cancellationToken);
    }

    public async Task<IReadOnlyList<UrgentTicketRow>> GetUrgentTicketsAsync(Guid organizationId,
        IReadOnlyCollection<Guid> openStatusIds, int take, CancellationToken cancellationToken)
    {
        List<Guid> openIds = openStatusIds.ToList();

        return await StatusedTickets(organizationId)
            .Where(t => openIds.Contains(t.TicketStatusId!.Value))
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
                t.TicketStatus != null ? t.TicketStatus.Name : string.Empty,
                t.Project != null ? t.Project.Name : null,
                t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
                t.Comments.Count))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ClosedTicketActivityRow>> GetClosedTicketActivityAsync(Guid organizationId,
        DateTime since, int take, CancellationToken cancellationToken) =>
        await Tickets(organizationId)
            .Where(t => t.TicketStatus != null && t.TicketStatus.IsClosed && t.UpdatedAt >= since)
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

    private IQueryable<Ticket> StatusedTickets(Guid organizationId) =>
        Tickets(organizationId).Where(t => t.TicketStatusId != null);

    private IQueryable<Vulnerability> Vulnerabilities(Guid organizationId) =>
        _context.Vulnerabilities.AsNoTracking()
            .Where(v => v.Dependency.Project.OrganizationId == organizationId);
}
