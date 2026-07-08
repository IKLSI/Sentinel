using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class DashboardService
{
    private readonly SentinelContext _context;
    private readonly IMemoryCache _cache;

    public DashboardService(SentinelContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(Guid organizationId)
    {
        string cacheKey = CacheKeys.Dashboard(organizationId);

        if (_cache.TryGetValue(cacheKey, out DashboardStatsDto? cached) && cached != null)
            return cached;

        DateTime now = DateTime.UtcNow;
        DateTime monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime lastMonthStart = monthStart.AddMonths(-1);
        DateTime lastMonthEnd = monthStart.AddTicks(-1);
        DateTime weekAgo = now.AddDays(-7);
        DateOnly monthStartDate = DateOnly.FromDateTime(monthStart);
        DateOnly todayDate = DateOnly.FromDateTime(now);
        TicketPriority[] allPriorities = [TicketPriority.Critical, TicketPriority.High, TicketPriority.Medium, TicketPriority.Low];

        List<TicketStatus> statuses = await _context.TicketStatuses
            .AsNoTracking()
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Order)
            .ToListAsync();

        List<Guid> openStatusIds = statuses.Where(s => !s.IsClosed).Select(s => s.Id).ToList();
        List<Guid> closedStatusIds = statuses.Where(s => s.IsClosed).Select(s => s.Id).ToList();

        var statusCounts = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId && t.TicketStatusId != null)
            .GroupBy(t => t.TicketStatusId!.Value)
            .Select(g => new { StatusId = g.Key, Count = g.Count() })
            .ToListAsync();
        Dictionary<Guid, int> statusCountDict = statusCounts.ToDictionary(x => x.StatusId, x => x.Count);

        int openTickets = openStatusIds.Sum(id => statusCountDict.GetValueOrDefault(id));

        var ticketCounters = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId && t.TicketStatusId != null)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                OpenDelta = g.Count(t => openStatusIds.Contains(t.TicketStatusId!.Value) && t.CreatedAt >= weekAgo),
                ResolvedMonth = g.Count(t => closedStatusIds.Contains(t.TicketStatusId!.Value) && t.UpdatedAt >= monthStart),
                ResolvedLast = g.Count(t => closedStatusIds.Contains(t.TicketStatusId!.Value) && t.UpdatedAt >= lastMonthStart && t.UpdatedAt <= lastMonthEnd),
                Unassigned = g.Count(t => openStatusIds.Contains(t.TicketStatusId!.Value) && t.AssignedToId == null),
            })
            .SingleOrDefaultAsync();

        int openTicketsDelta = ticketCounters?.OpenDelta ?? 0;
        int resolvedThisMonth = ticketCounters?.ResolvedMonth ?? 0;
        int resolvedLastMonth = ticketCounters?.ResolvedLast ?? 0;
        int unassignedOpenTickets = ticketCounters?.Unassigned ?? 0;

        int hoursThisMonth = await _context.TimeEntries
            .AsNoTracking()
            .Where(te => te.User.OrganizationId == organizationId && te.Date >= monthStartDate && te.Date <= todayDate)
            .SumAsync(te => (int?)te.DurationMinutes) ?? 0;

        int criticalVulnerabilities = await _context.Vulnerabilities
            .AsNoTracking()
            .Where(v => v.Severity == VulnerabilitySeverity.Critical && v.Dependency.Project.OrganizationId == organizationId)
            .CountAsync();

        Dictionary<string, int> ticketsByStatus = statuses.ToDictionary(
            s => s.Name,
            s => statusCountDict.GetValueOrDefault(s.Id));

        Dictionary<string, string> ticketsByStatusColor = statuses.ToDictionary(
            s => s.Name,
            s => s.Color);

        var priorityCounts = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId
                && t.TicketStatusId != null
                && openStatusIds.Contains(t.TicketStatusId.Value))
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync();
        Dictionary<TicketPriority, int> priorityCountDict = priorityCounts.ToDictionary(x => x.Priority, x => x.Count);
        Dictionary<string, int> ticketsByPriority = allPriorities.ToDictionary(
            p => p.ToString(),
            p => priorityCountDict.GetValueOrDefault(p));

        var rawUrgentTickets = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId
                && t.TicketStatusId != null
                && openStatusIds.Contains(t.TicketStatusId.Value))
            .OrderByDescending(t =>
                t.Priority == TicketPriority.Critical ? 4 :
                t.Priority == TicketPriority.High ? 3 :
                t.Priority == TicketPriority.Medium ? 2 : 1)
            .ThenBy(t => t.CreatedAt)
            .Take(8)
            .Select(t => new
            {
                t.Id,
                t.Title,
                Priority = t.Priority.ToString().ToLower(),
                Type = t.Type.ToString().ToLower(),
                StatusName = t.TicketStatus != null ? t.TicketStatus.Name : string.Empty,
                ProjectName = t.Project != null ? t.Project.Name : null,
                AssignedToName = t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
                CommentCount = t.Comments.Count
            })
            .ToListAsync();

        List<UrgentTicketDto> urgentTickets = rawUrgentTickets
            .Select(t => new UrgentTicketDto
            {
                Id = t.Id.ToString(),
                Reference = $"TKT-{t.Id.ToString()[..6].ToUpper()}",
                Title = t.Title,
                Priority = t.Priority,
                Type = t.Type,
                Status = t.StatusName,
                ProjectName = t.ProjectName,
                AssignedToName = t.AssignedToName,
                CommentCount = t.CommentCount,
            })
            .ToList();

        List<ActivityItemDto> recentActivity = await BuildRecentActivityAsync(organizationId, now);

        DateTime sevenDaysAgo = now.AddDays(-6).Date;
        var detectionCounts = await _context.Vulnerabilities
            .AsNoTracking()
            .Where(v => v.Dependency.Project.OrganizationId == organizationId && v.DetectedAt >= sevenDaysAgo)
            .GroupBy(v => v.DetectedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();
        Dictionary<DateTime, int> detectionDict = detectionCounts.ToDictionary(x => x.Date, x => x.Count);
        List<VulnerabilityDetectionDataPointDto> vulnerabilitiesDetectedPerDay = Enumerable
            .Range(0, 7)
            .Select(i => now.AddDays(-6 + i).Date)
            .Select(d => new VulnerabilityDetectionDataPointDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                Count = detectionDict.GetValueOrDefault(d, 0),
            })
            .ToList();

        DashboardStatsDto result = new DashboardStatsDto
        {
            OpenTickets = openTickets,
            OpenTicketsDelta = openTicketsDelta,
            ResolvedThisMonth = resolvedThisMonth,
            ResolvedThisMonthDelta = resolvedThisMonth - resolvedLastMonth,
            HoursThisMonth = hoursThisMonth / 60,
            CriticalVulnerabilities = criticalVulnerabilities,
            TicketsByStatus = ticketsByStatus,
            TicketsByStatusColor = ticketsByStatusColor,
            TicketsByPriority = ticketsByPriority,
            UnassignedOpenTickets = unassignedOpenTickets,
            UrgentTickets = urgentTickets,
            RecentActivity = recentActivity,
            VulnerabilitiesDetectedPerDay = vulnerabilitiesDetectedPerDay,
        };

        _cache.Set(cacheKey, result, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
            Priority = CacheItemPriority.High
        });

        return result;
    }

    public async Task<List<ActivityItemDto>> BuildRecentActivityAsync(Guid organizationId, DateTime now)
    {
        DateTime since = now.AddDays(-7);
        List<ActivityItemDto> items = new List<ActivityItemDto>();

        var closedTickets = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId
                && t.TicketStatus != null && t.TicketStatus.IsClosed
                && t.UpdatedAt >= since)
            .OrderByDescending(t => t.UpdatedAt)
            .Take(8)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.UpdatedAt,
                ProjectName = t.Project != null ? t.Project.Name : null,
                AssigneeFirstName = t.AssignedTo != null ? t.AssignedTo.FirstName : null,
                AssigneeLastName = t.AssignedTo != null ? t.AssignedTo.LastName : null,
                CreatedByFirstName = t.CreatedBy != null ? t.CreatedBy.FirstName : null,
                CreatedByLastName = t.CreatedBy != null ? t.CreatedBy.LastName : null,
            })
            .ToListAsync();

        foreach (var t in closedTickets)
        {
            string reference = $"TKT-{t.Id.ToString()[..6].ToUpper()}";
            string? userName = t.AssigneeFirstName is not null
                ? $"{t.AssigneeFirstName} {t.AssigneeLastName}"
                : t.CreatedByFirstName is not null
                    ? $"{t.CreatedByFirstName} {t.CreatedByLastName}"
                    : null;
            List<string> detailParts = [];
            if (t.ProjectName is string pn) detailParts.Add(pn);
            if (userName is not null) detailParts.Add(userName);
            items.Add(new ActivityItemDto
            {
                Color = "accent",
                Text = $"Ticket résolu — {reference}",
                Timestamp = t.UpdatedAt,
                Detail = detailParts.Count > 0 ? string.Join(" · ", detailParts) : null,
                TicketId = t.Id.ToString(),
                Type = "resolved",
                Reference = reference,
                ProjectName = t.ProjectName,
            });
        }

        var createdTickets = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId && t.CreatedAt >= since)
            .OrderByDescending(t => t.CreatedAt)
            .Take(8)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.CreatedAt,
                ProjectName = t.Project != null ? t.Project.Name : null,
                CreatedByFirstName = t.CreatedBy != null ? t.CreatedBy.FirstName : null,
                CreatedByLastName = t.CreatedBy != null ? t.CreatedBy.LastName : null,
            })
            .ToListAsync();

        foreach (var t in createdTickets)
        {
            string reference = $"TKT-{t.Id.ToString()[..6].ToUpper()}";
            List<string> detailParts = [];
            if (t.ProjectName is string pn) detailParts.Add(pn);
            if (t.CreatedByFirstName is not null) detailParts.Add($"{t.CreatedByFirstName} {t.CreatedByLastName}");
            items.Add(new ActivityItemDto
            {
                Color = "green",
                Text = $"Ticket créé — {reference}",
                Timestamp = t.CreatedAt,
                Detail = detailParts.Count > 0 ? string.Join(" · ", detailParts) : null,
                TicketId = t.Id.ToString(),
                Type = "created",
                Reference = reference,
                ProjectName = t.ProjectName,
            });
        }

        var recentVulns = await _context.Vulnerabilities
            .AsNoTracking()
            .Where(v => v.Severity == VulnerabilitySeverity.Critical
                && v.Dependency.Project.OrganizationId == organizationId
                && v.DetectedAt >= since)
            .Select(v => new
            {
                v.DetectedAt,
                v.CveId,
                v.CvssScore,
                ProjectName = v.Dependency.Project.Name,
                ProjectId = v.Dependency.Project.Id,
            })
            .ToListAsync();

        var vulnsByProject = recentVulns
            .GroupBy(v => v.ProjectId)
            .Select(g =>
            {
                var worst = g.OrderByDescending(v => v.CvssScore).First();
                return new
                {
                    ProjectId = g.Key,
                    ProjectName = g.First().ProjectName,
                    Count = g.Count(),
                    LatestDetectedAt = g.Max(v => v.DetectedAt),
                    WorstCveId = worst.CveId,
                    WorstCvssScore = worst.CvssScore,
                };
            });

        foreach (var g in vulnsByProject)
        {
            string vulnText = g.Count > 1
                ? $"Vulnérabilités critiques détectées sur {g.ProjectName}"
                : $"Vulnérabilité critique détectée sur {g.ProjectName}";
            string detail = g.Count > 1
                ? $"{g.WorstCveId} +{g.Count - 1} autre{(g.Count > 2 ? "s" : "")} · CVSS {g.WorstCvssScore:F1}"
                : $"{g.WorstCveId} · CVSS {g.WorstCvssScore:F1}";
            items.Add(new ActivityItemDto
            {
                Color = "red",
                Text = vulnText,
                Timestamp = g.LatestDetectedAt,
                Detail = detail,
                ProjectId = g.ProjectId.ToString(),
                Count = g.Count > 1 ? g.Count : null,
                Type = "vuln",
                ProjectName = g.ProjectName,
                VulnCveId = g.WorstCveId,
                VulnOtherCount = g.Count > 1 ? g.Count - 1 : null,
                VulnCvssScore = (double?)g.WorstCvssScore,
            });
        }

        return [.. items.OrderByDescending(a => a.Timestamp).Take(8)];
    }
}
