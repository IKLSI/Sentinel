using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsService(
    ITicketRepository ticketRepository,
    ITicketStatusRepository ticketStatusRepository,
    IVulnerabilityRepository vulnerabilityRepository,
    IMemoryCache cache,
    ITenantContext tenant) : IService
{
    private static readonly TicketPriority[] AllPriorities =
        [TicketPriority.Critical, TicketPriority.High, TicketPriority.Medium, TicketPriority.Low];

    private const int UrgentTicketCount = 8;
    private const int ActivityCount = 8;
    private const int DetectionWindowDays = 7;

    public async Task<Result<DashboardStatsDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || organizationId == Guid.Empty)
            return Result<DashboardStatsDto>.Unauthorized();

        string cacheKey = CacheKeys.Dashboard(organizationId);

        if (cache.TryGetValue(cacheKey, out DashboardStatsDto? cached) && cached != null)
            return cached;

        DashboardStatsDto stats = await BuildStatsAsync(organizationId, cancellationToken);

        cache.Set(cacheKey, stats, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
            Priority = CacheItemPriority.High
        });

        return stats;
    }

    private async Task<DashboardStatsDto> BuildStatsAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        DateTime now = DateTime.UtcNow;
        DateTime monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime lastMonthStart = monthStart.AddMonths(-1);
        DateTime lastMonthEnd = monthStart.AddTicks(-1);
        DateTime weekAgo = now.AddDays(-7);

        List<TicketStatus> statuses = await ticketStatusRepository
            .GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly)
            .OrderBy(s => s.Order)
            .ToListAsync(cancellationToken);

        List<Guid> openStatusIds = statuses.Where(s => !s.IsClosed).Select(s => s.Id).ToList();
        List<Guid> closedStatusIds = statuses.Where(s => s.IsClosed).Select(s => s.Id).ToList();

        IQueryable<Ticket> tickets = ticketRepository
            .GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly)
            .Where(t => t.TicketStatusId != null);

        Dictionary<Guid, int> statusCounts = await tickets
            .GroupBy(t => t.TicketStatusId!.Value)
            .Select(g => new { StatusId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StatusId, x => x.Count, cancellationToken);

        var counters = await tickets
            .GroupBy(_ => 1)
            .Select(g => new
            {
                OpenDelta = g.Count(t => openStatusIds.Contains(t.TicketStatusId!.Value) && t.CreatedAt >= weekAgo),
                ResolvedMonth = g.Count(t => closedStatusIds.Contains(t.TicketStatusId!.Value) && t.UpdatedAt >= monthStart),
                ResolvedLast = g.Count(t => closedStatusIds.Contains(t.TicketStatusId!.Value) && t.UpdatedAt >= lastMonthStart && t.UpdatedAt <= lastMonthEnd),
                Unassigned = g.Count(t => openStatusIds.Contains(t.TicketStatusId!.Value) && t.AssignedToId == null),
            })
            .SingleOrDefaultAsync(cancellationToken);

        int criticalVulnerabilities = await vulnerabilityRepository
            .GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly)
            .CountAsync(v => v.Severity == VulnerabilitySeverity.Critical, cancellationToken);

        Dictionary<TicketPriority, int> priorityCounts = await tickets
            .Where(t => openStatusIds.Contains(t.TicketStatusId!.Value))
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Priority, x => x.Count, cancellationToken);

        int resolvedThisMonth = counters?.ResolvedMonth ?? 0;

        return new DashboardStatsDto
        {
            OpenTickets = openStatusIds.Sum(id => statusCounts.GetValueOrDefault(id)),
            OpenTicketsDelta = counters?.OpenDelta ?? 0,
            ResolvedThisMonth = resolvedThisMonth,
            ResolvedThisMonthDelta = resolvedThisMonth - (counters?.ResolvedLast ?? 0),
            CriticalVulnerabilities = criticalVulnerabilities,
            TicketsByStatus = statuses.ToDictionary(s => s.Name, s => statusCounts.GetValueOrDefault(s.Id)),
            TicketsByStatusColor = statuses.ToDictionary(s => s.Name, s => s.Color),
            TicketsByPriority = AllPriorities.ToDictionary(p => p.ToString(), p => priorityCounts.GetValueOrDefault(p)),
            UnassignedOpenTickets = counters?.Unassigned ?? 0,
            UrgentTickets = await BuildUrgentTicketsAsync(tickets, openStatusIds, cancellationToken),
            RecentActivity = await BuildRecentActivityAsync(organizationId, now, cancellationToken),
            VulnerabilitiesDetectedPerDay = await BuildDetectionSeriesAsync(organizationId, now, cancellationToken),
        };
    }

    private static async Task<List<UrgentTicketDto>> BuildUrgentTicketsAsync(IQueryable<Ticket> tickets,
        List<Guid> openStatusIds, CancellationToken cancellationToken)
    {
        var raw = await tickets
            .Where(t => openStatusIds.Contains(t.TicketStatusId!.Value))
            .OrderByDescending(t =>
                t.Priority == TicketPriority.Critical ? 4 :
                t.Priority == TicketPriority.High ? 3 :
                t.Priority == TicketPriority.Medium ? 2 : 1)
            .ThenBy(t => t.CreatedAt)
            .Take(UrgentTicketCount)
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
            .ToListAsync(cancellationToken);

        return raw.Select(t => new UrgentTicketDto
        {
            Id = t.Id.ToString(),
            Reference = TicketReference.For(t.Id),
            Title = t.Title,
            Priority = t.Priority,
            Type = t.Type,
            Status = t.StatusName,
            ProjectName = t.ProjectName,
            AssignedToName = t.AssignedToName,
            CommentCount = t.CommentCount,
        }).ToList();
    }

    private async Task<List<VulnerabilityDetectionDataPointDto>> BuildDetectionSeriesAsync(Guid organizationId,
        DateTime now, CancellationToken cancellationToken)
    {
        DateTime windowStart = now.AddDays(-(DetectionWindowDays - 1)).Date;

        Dictionary<DateTime, int> detections = await vulnerabilityRepository
            .GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly)
            .Where(v => v.DetectedAt >= windowStart)
            .GroupBy(v => v.DetectedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, cancellationToken);

        return Enumerable
            .Range(0, DetectionWindowDays)
            .Select(i => now.AddDays(-(DetectionWindowDays - 1) + i).Date)
            .Select(date => new VulnerabilityDetectionDataPointDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Count = detections.GetValueOrDefault(date, 0),
            })
            .ToList();
    }

    private async Task<List<ActivityItemDto>> BuildRecentActivityAsync(Guid organizationId, DateTime now,
        CancellationToken cancellationToken)
    {
        DateTime since = now.AddDays(-7);
        List<ActivityItemDto> items = [];

        IQueryable<Ticket> tickets = ticketRepository.GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly);

        var closedTickets = await tickets
            .Where(t => t.TicketStatus != null && t.TicketStatus.IsClosed && t.UpdatedAt >= since)
            .OrderByDescending(t => t.UpdatedAt)
            .Take(ActivityCount)
            .Select(t => new
            {
                t.Id,
                t.UpdatedAt,
                ProjectName = t.Project != null ? t.Project.Name : null,
                AssigneeFirstName = t.AssignedTo != null ? t.AssignedTo.FirstName : null,
                AssigneeLastName = t.AssignedTo != null ? t.AssignedTo.LastName : null,
                CreatedByFirstName = t.CreatedBy != null ? t.CreatedBy.FirstName : null,
                CreatedByLastName = t.CreatedBy != null ? t.CreatedBy.LastName : null,
            })
            .ToListAsync(cancellationToken);

        foreach (var ticket in closedTickets)
        {
            string reference = TicketReference.For(ticket.Id);
            string? userName = ticket.AssigneeFirstName is not null
                ? $"{ticket.AssigneeFirstName} {ticket.AssigneeLastName}"
                : ticket.CreatedByFirstName is not null
                    ? $"{ticket.CreatedByFirstName} {ticket.CreatedByLastName}"
                    : null;

            List<string> detailParts = [];
            if (ticket.ProjectName is string projectName) detailParts.Add(projectName);
            if (userName is not null) detailParts.Add(userName);

            items.Add(new ActivityItemDto
            {
                Color = "accent",
                Text = $"Ticket résolu — {reference}",
                Timestamp = ticket.UpdatedAt,
                Detail = detailParts.Count > 0 ? string.Join(" · ", detailParts) : null,
                TicketId = ticket.Id.ToString(),
                Type = "resolved",
                Reference = reference,
                ProjectName = ticket.ProjectName,
            });
        }

        var createdTickets = await tickets
            .Where(t => t.CreatedAt >= since)
            .OrderByDescending(t => t.CreatedAt)
            .Take(ActivityCount)
            .Select(t => new
            {
                t.Id,
                t.CreatedAt,
                ProjectName = t.Project != null ? t.Project.Name : null,
                CreatedByFirstName = t.CreatedBy != null ? t.CreatedBy.FirstName : null,
                CreatedByLastName = t.CreatedBy != null ? t.CreatedBy.LastName : null,
            })
            .ToListAsync(cancellationToken);

        foreach (var ticket in createdTickets)
        {
            string reference = TicketReference.For(ticket.Id);

            List<string> detailParts = [];
            if (ticket.ProjectName is string projectName) detailParts.Add(projectName);
            if (ticket.CreatedByFirstName is not null)
                detailParts.Add($"{ticket.CreatedByFirstName} {ticket.CreatedByLastName}");

            items.Add(new ActivityItemDto
            {
                Color = "green",
                Text = $"Ticket créé — {reference}",
                Timestamp = ticket.CreatedAt,
                Detail = detailParts.Count > 0 ? string.Join(" · ", detailParts) : null,
                TicketId = ticket.Id.ToString(),
                Type = "created",
                Reference = reference,
                ProjectName = ticket.ProjectName,
            });
        }

        items.AddRange(await BuildVulnerabilityActivityAsync(organizationId, since, cancellationToken));

        return [.. items.OrderByDescending(a => a.Timestamp).Take(ActivityCount)];
    }

    private async Task<List<ActivityItemDto>> BuildVulnerabilityActivityAsync(Guid organizationId, DateTime since,
        CancellationToken cancellationToken)
    {
        var recentVulnerabilities = await vulnerabilityRepository
            .GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly)
            .Where(v => v.Severity == VulnerabilitySeverity.Critical && v.DetectedAt >= since)
            .Select(v => new
            {
                v.DetectedAt,
                v.CveId,
                v.CvssScore,
                ProjectName = v.Dependency.Project.Name,
                ProjectId = v.Dependency.Project.Id,
            })
            .ToListAsync(cancellationToken);

        return recentVulnerabilities
            .GroupBy(v => v.ProjectId)
            .Select(group =>
            {
                var worst = group.OrderByDescending(v => v.CvssScore).First();
                int count = group.Count();

                return new ActivityItemDto
                {
                    Color = "red",
                    Text = count > 1
                        ? $"Vulnérabilités critiques détectées sur {worst.ProjectName}"
                        : $"Vulnérabilité critique détectée sur {worst.ProjectName}",
                    Timestamp = group.Max(v => v.DetectedAt),
                    Detail = count > 1
                        ? $"{worst.CveId} +{count - 1} autre{(count > 2 ? "s" : "")} · CVSS {worst.CvssScore:F1}"
                        : $"{worst.CveId} · CVSS {worst.CvssScore:F1}",
                    ProjectId = group.Key.ToString(),
                    Count = count > 1 ? count : null,
                    Type = "vuln",
                    ProjectName = worst.ProjectName,
                    VulnCveId = worst.CveId,
                    VulnOtherCount = count > 1 ? count - 1 : null,
                    VulnCvssScore = (double?)worst.CvssScore,
                };
            })
            .ToList();
    }
}
