using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class DashboardService
{
    private readonly SentinelContext _context;
    private readonly IMemoryCache _cache;
    private const string CacheKeyPrefix = "dashboard";

    public DashboardService(SentinelContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(Guid organizationId)
    {
        string cacheKey = $"{CacheKeyPrefix}:{organizationId}";

        if (_cache.TryGetValue(cacheKey, out DashboardStatsDto? cached) && cached != null)
            return cached;

        DateTime now = DateTime.UtcNow;
        DateTime monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime lastMonthStart = monthStart.AddMonths(-1);
        DateTime lastMonthEnd = monthStart.AddTicks(-1);
        DateTime weekAgo = now.AddDays(-7);
        DateOnly monthStartDate = DateOnly.FromDateTime(monthStart);
        DateOnly todayDate = DateOnly.FromDateTime(now);

        TicketStatus[] openStatuses = [TicketStatus.New, TicketStatus.InProgress, TicketStatus.Testing];
        TicketStatus[] closedStatuses = [TicketStatus.Resolved, TicketStatus.Closed];
        TicketStatus[] allStatuses = [TicketStatus.New, TicketStatus.InProgress, TicketStatus.Testing, TicketStatus.Resolved, TicketStatus.Closed];
        TicketPriority[] allPriorities = [TicketPriority.Critical, TicketPriority.High, TicketPriority.Medium, TicketPriority.Low];

        var statusCounts = await _context.Tickets
            .Where(t => t.OrganizationId == organizationId)
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();
        Dictionary<TicketStatus, int> statusCountDict = statusCounts.ToDictionary(x => x.Status, x => x.Count);

        int openTickets = openStatuses.Sum(s => statusCountDict.GetValueOrDefault(s));

        int openTicketsDelta = await _context.Tickets
            .CountAsync(t => t.OrganizationId == organizationId
                && openStatuses.Contains(t.Status)
                && t.CreatedAt >= weekAgo);

        int resolvedThisMonth = await _context.Tickets
            .CountAsync(t => t.OrganizationId == organizationId
                && closedStatuses.Contains(t.Status)
                && t.UpdatedAt >= monthStart);

        int resolvedLastMonth = await _context.Tickets
            .CountAsync(t => t.OrganizationId == organizationId
                && closedStatuses.Contains(t.Status)
                && t.UpdatedAt >= lastMonthStart && t.UpdatedAt <= lastMonthEnd);

        int hoursThisMonth = await _context.TimeEntries
            .Include(te => te.User)
            .Where(te => te.User.OrganizationId == organizationId && te.Date >= monthStartDate && te.Date <= todayDate)
            .SumAsync(te => (int?)te.DurationMinutes) ?? 0;

        int criticalVulnerabilities = await _context.Vulnerabilities
            .Include(v => v.Dependency).ThenInclude(d => d.TechProject)
            .Where(v => v.Severity == VulnerabilitySeverity.Critical && v.Dependency.TechProject.OrganizationId == organizationId)
            .CountAsync();

        Dictionary<string, int> ticketsByStatus = allStatuses.ToDictionary(
            s => s.ToString(),
            s => statusCountDict.GetValueOrDefault(s));

        var priorityCounts = await _context.Tickets
            .Where(t => t.OrganizationId == organizationId && openStatuses.Contains(t.Status))
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync();
        Dictionary<TicketPriority, int> priorityCountDict = priorityCounts.ToDictionary(x => x.Priority, x => x.Count);
        Dictionary<string, int> ticketsByPriority = allPriorities.ToDictionary(
            p => p.ToString(),
            p => priorityCountDict.GetValueOrDefault(p));

        int unassignedOpenTickets = await _context.Tickets
            .CountAsync(t => t.OrganizationId == organizationId
                && openStatuses.Contains(t.Status)
                && t.AssignedToId == null);

        List<Ticket> rawUrgentTickets = await _context.Tickets
            .Include(t => t.Project)
            .Where(t => t.OrganizationId == organizationId
                && openStatuses.Contains(t.Status)
                && (t.Priority == TicketPriority.Critical || t.Priority == TicketPriority.High))
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.CreatedAt)
            .Take(5)
            .ToListAsync();

        List<UrgentTicketDto> urgentTickets = rawUrgentTickets
            .Select(t => new UrgentTicketDto
            {
                Id = t.Id.ToString(),
                Reference = $"TKT-{t.Id.ToString()[..6].ToUpper()}",
                Title = t.Title,
                Priority = t.Priority.ToString().ToLower(),
                Type = t.Type.ToString().ToLower(),
                ProjectName = t.Project?.Name,
            })
            .ToList();

        List<ActivityItemDto> recentActivity = await BuildRecentActivityAsync(organizationId, now);

        DashboardStatsDto result = new DashboardStatsDto
        {
            OpenTickets = openTickets,
            OpenTicketsDelta = openTicketsDelta,
            ResolvedThisMonth = resolvedThisMonth,
            ResolvedThisMonthDelta = resolvedThisMonth - resolvedLastMonth,
            HoursThisMonth = hoursThisMonth / 60,
            CriticalVulnerabilities = criticalVulnerabilities,
            TicketsByStatus = ticketsByStatus,
            TicketsByPriority = ticketsByPriority,
            UnassignedOpenTickets = unassignedOpenTickets,
            UrgentTickets = urgentTickets,
            RecentActivity = recentActivity,
        };

        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(2));

        return result;
    }

    public async Task<List<ActivityItemDto>> BuildRecentActivityAsync(Guid organizationId, DateTime now)
    {
        DateTime since = now.AddDays(-7);
        List<ActivityItemDto> items = new List<ActivityItemDto>();

        List<Ticket> closedTickets = await _context.Tickets
            .Include(t => t.Project)
            .Where(t => t.OrganizationId == organizationId
                && (t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed)
                && t.UpdatedAt >= since)
            .OrderByDescending(t => t.UpdatedAt)
            .Take(3)
            .ToListAsync();

        foreach (Ticket? t in closedTickets)
        {
            string proj = t.Project?.Name is string pn ? $" — {pn}" : "";
            items.Add(new ActivityItemDto
            {
                Color = "accent",
                Text = $"Ticket {(t.Title.Length > 40 ? t.Title[..40] + "…" : t.Title)} résolu{proj}",
                Timestamp = t.UpdatedAt,
                Detail = t.Priority switch
                {
                    TicketPriority.Critical => "Critique",
                    TicketPriority.High     => "Haute",
                    TicketPriority.Medium   => "Moyenne",
                    TicketPriority.Low      => "Basse",
                    _                       => t.Priority.ToString(),
                },
            });
        }

        List<Vulnerability> recentVulns = await _context.Vulnerabilities
            .Include(v => v.Dependency).ThenInclude(d => d.TechProject)
            .Where(v => v.Severity == VulnerabilitySeverity.Critical
                && v.Dependency.TechProject.OrganizationId == organizationId
                && v.DetectedAt >= since)
            .OrderByDescending(v => v.DetectedAt)
            .Take(2)
            .ToListAsync();

        foreach (Vulnerability? v in recentVulns)
        {
            items.Add(new ActivityItemDto
            {
                Color = "red",
                Text = $"Vuln critique détectée — {v.CveId} sur {v.Dependency.TechProject.Name}",
                Timestamp = v.DetectedAt,
                Detail = "Scanner automatique",
            });
        }

        return [.. items.OrderByDescending(a => a.Timestamp).Take(5)];
    }
}
