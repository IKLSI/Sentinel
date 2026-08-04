using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsService(
    IDashboardRepository dashboardRepository,
    IMemoryCache cache,
    ITenantContext tenant) : IService
{
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
            Priority = CacheItemPriority.High,
            Size = 1
        });

        return stats;
    }

    private async Task<DashboardStatsDto> BuildStatsAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        DateTime now = DateTime.UtcNow;

        return new DashboardStatsDto
        {
            UrgentTickets = await BuildUrgentTicketsAsync(organizationId, cancellationToken),
            RecentActivity = await BuildRecentActivityAsync(organizationId, now, cancellationToken),
            VulnerabilitiesDetectedPerDay = await BuildDetectionSeriesAsync(organizationId, now, cancellationToken),
        };
    }

    private async Task<List<UrgentTicketDto>> BuildUrgentTicketsAsync(Guid organizationId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<UrgentTicketRow> raw = await dashboardRepository.GetUrgentTicketsAsync(organizationId,
            UrgentTicketCount, cancellationToken);

        return raw.Select(t => new UrgentTicketDto
        {
            Id = t.Id.ToString(),
            Reference = TicketReference.For(t.Number),
            Title = t.Title,
            Priority = t.Priority,
            Type = t.Type,
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
            string reference = TicketReference.For(ticket.Number);
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
            string reference = TicketReference.For(ticket.Number);

            List<string> detailParts = [];
            if (ticket.ProjectName is string projectName) detailParts.Add(projectName);
            if (ticket.CreatedByFirstName is not null)
                detailParts.Add($"{ticket.CreatedByFirstName} {ticket.CreatedByLastName}");

            items.Add(new ActivityItemDto
            {
                Color = "green",
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
                    Timestamp = group.Max(v => v.DetectedAt),
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
