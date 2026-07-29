using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsService(
    IDashboardRepository dashboardRepository,
    ITicketStatusRepository ticketStatusRepository,
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
        DashboardPeriod period = new(
            WeekAgo: now.AddDays(-7),
            MonthStart: monthStart,
            LastMonthStart: monthStart.AddMonths(-1),
            LastMonthEnd: monthStart.AddTicks(-1));

        IReadOnlyList<TicketStatus> statuses =
            await ticketStatusRepository.ListByOrganizationOrderedAsync(organizationId, cancellationToken);

        List<Guid> openStatusIds = statuses.Where(s => !s.IsClosed).Select(s => s.Id).ToList();
        List<Guid> closedStatusIds = statuses.Where(s => s.IsClosed).Select(s => s.Id).ToList();

        IReadOnlyDictionary<Guid, int> statusCounts =
            await dashboardRepository.GetTicketCountsByStatusAsync(organizationId, cancellationToken);

        DashboardCounters? counters = await dashboardRepository.GetCountersAsync(organizationId, openStatusIds,
            closedStatusIds, period, cancellationToken);

        int criticalVulnerabilities =
            await dashboardRepository.CountCriticalVulnerabilitiesAsync(organizationId, cancellationToken);

        IReadOnlyDictionary<TicketPriority, int> priorityCounts = await dashboardRepository
            .GetOpenTicketCountsByPriorityAsync(organizationId, openStatusIds, cancellationToken);

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
            UrgentTickets = await BuildUrgentTicketsAsync(organizationId, openStatusIds, cancellationToken),
            RecentActivity = await BuildRecentActivityAsync(organizationId, now, cancellationToken),
            VulnerabilitiesDetectedPerDay = await BuildDetectionSeriesAsync(organizationId, now, cancellationToken),
        };
    }

    private async Task<List<UrgentTicketDto>> BuildUrgentTicketsAsync(Guid organizationId,
        IReadOnlyCollection<Guid> openStatusIds, CancellationToken cancellationToken)
    {
        IReadOnlyList<UrgentTicketRow> raw = await dashboardRepository.GetUrgentTicketsAsync(organizationId,
            openStatusIds, UrgentTicketCount, cancellationToken);

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

        IReadOnlyDictionary<DateTime, int> detections = await dashboardRepository
            .GetVulnerabilityDetectionCountsAsync(organizationId, windowStart, cancellationToken);

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

        IReadOnlyList<ClosedTicketActivityRow> closedTickets = await dashboardRepository
            .GetClosedTicketActivityAsync(organizationId, since, ActivityCount, cancellationToken);

        foreach (ClosedTicketActivityRow ticket in closedTickets)
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

        IReadOnlyList<CreatedTicketActivityRow> createdTickets = await dashboardRepository
            .GetCreatedTicketActivityAsync(organizationId, since, ActivityCount, cancellationToken);

        foreach (CreatedTicketActivityRow ticket in createdTickets)
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
        IReadOnlyList<VulnerabilityActivityRow> recentVulnerabilities = await dashboardRepository
            .GetCriticalVulnerabilityActivityAsync(organizationId, since, cancellationToken);

        return recentVulnerabilities
            .GroupBy(v => v.ProjectId)
            .Select(group =>
            {
                VulnerabilityActivityRow worst = group.OrderByDescending(v => v.CvssScore).First();
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
