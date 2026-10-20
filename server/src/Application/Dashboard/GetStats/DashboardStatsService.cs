using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsService(
    IDashboardRepository dashboardRepository,
    IProjectRepository projectRepository,
    DashboardStatsValidator validator,
    IMemoryCache cache,
    ITenantContext tenant) : IService
{
    private const int ActivityCount = 8;
    private const int MaxProjects = 500;
    private const int ProjectRowCount = 5;
    private const int UrgentTicketCount = 8;

    public async Task<Result<DashboardStatsDto>> ExecuteAsync(DashboardStatsRequest request,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || organizationId == Guid.Empty)
            return Result<DashboardStatsDto>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<DashboardStatsDto>.From(validationResult);

        if (cache.TryGetValue(CacheKeys.Dashboard(organizationId, (int)request.Period),
                out DashboardStatsDto? cached) && cached != null)
            return cached;

        IReadOnlyDictionary<DashboardPeriod, DashboardStatsDto> statsByPeriod =
            await BuildAllPeriodsAsync(organizationId, cancellationToken);

        MemoryCacheEntryOptions cacheOptions = new()
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
            Priority = CacheItemPriority.High,
            Size = 1
        };

        foreach ((DashboardPeriod period, DashboardStatsDto stats) in statsByPeriod)
            cache.Set(CacheKeys.Dashboard(organizationId, (int)period), stats, cacheOptions);

        return statsByPeriod[request.Period];
    }

    private async Task<IReadOnlyDictionary<DashboardPeriod, DashboardStatsDto>> BuildAllPeriodsAsync(
        Guid organizationId, CancellationToken cancellationToken)
    {
        DateTime now = DateTime.UtcNow;
        DateOnly today = DateOnly.FromDateTime(now);
        DateOnly widestStart = WindowStart(Enum.GetValues<DashboardPeriod>().Max(), today);
        DateTime widestStartAt = widestStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        IReadOnlyList<Project> projects = await projectRepository.ListWithHealthDetailsByNameAsync(organizationId,
            MaxProjects, cancellationToken);
        IReadOnlyList<OpenTicketRow> openTickets = await dashboardRepository.GetOpenTicketsAsync(organizationId,
            cancellationToken);
        IReadOnlyList<ScoreSnapshotRow> snapshots = await LoadSnapshotsAsync(organizationId, projects, widestStart,
            today, cancellationToken);
        IReadOnlyDictionary<DateTime, int> openDetections = await dashboardRepository
            .GetVulnerabilityDetectionCountsAsync(organizationId, widestStartAt, cancellationToken);
        IReadOnlyDictionary<DateTime, int> resolvedDetections = await dashboardRepository
            .GetResolvedVulnerabilityDetectionCountsAsync(organizationId, widestStartAt, cancellationToken);
        IReadOnlyDictionary<DateTime, int> resolutions = await dashboardRepository
            .GetVulnerabilityResolutionCountsAsync(organizationId, widestStartAt, cancellationToken);
        List<ActivityItemDto> recentActivity = await BuildRecentActivityAsync(organizationId, now, cancellationToken);

        IReadOnlyList<RuntimeDeadline> deadlines = RuntimeDeadlineCalculator.Compute(projects, today);
        List<UrgentTicketDto> urgentTickets = await BuildUrgentTicketsAsync(organizationId, cancellationToken);

        return Enum.GetValues<DashboardPeriod>().ToDictionary(period => period, period =>
        {
            DateOnly windowStart = WindowStart(period, today);
            List<ScorePointDto> scoreHistory = ScoreHistoryBuilder.Build(snapshots, windowStart, today);

            return new DashboardStatsDto
            {
                Overview = ParkOverviewCalculator.Build(projects, deadlines, ScoreHistoryBuilder.Delta(scoreHistory)),
                ScoreHistory = scoreHistory,
                VulnerabilityFlow = VulnerabilityFlowBuilder.Build(openDetections, resolvedDetections, resolutions,
                    windowStart, today),
                UrgentTickets = urgentTickets,
                Projects = ProjectHealthBuilder.Build(projects, ScoreHistoryBuilder.ScoresAt(snapshots, windowStart),
                    openTickets, deadlines, ProjectRowCount),
                RecentActivity = recentActivity,
            };
        });
    }

    private async Task<List<UrgentTicketDto>> BuildUrgentTicketsAsync(Guid organizationId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<UrgentTicketRow> rows = await dashboardRepository.GetUrgentTicketsAsync(organizationId,
            UrgentTicketCount, cancellationToken);

        return rows.Select(row => new UrgentTicketDto
        {
            Id = row.Id.ToString(),
            Reference = TicketReference.For(row.Number),
            Title = row.Title,
            Priority = row.Priority,
            Type = row.Type,
            ProjectName = row.ProjectName,
            AssignedToName = row.AssignedToName,
            CommentCount = row.CommentCount,
        }).ToList();
    }

    private static DateOnly WindowStart(DashboardPeriod period, DateOnly today) => today.AddDays(-((int)period - 1));

    private async Task<IReadOnlyList<ScoreSnapshotRow>> LoadSnapshotsAsync(Guid organizationId,
        IReadOnlyList<Project> projects, DateOnly windowStart, DateOnly today, CancellationToken cancellationToken)
    {
        IReadOnlyList<ScoreSnapshotRow> stored = await dashboardRepository.GetScoreSnapshotsAsync(organizationId,
            windowStart, cancellationToken);

        HashSet<Guid> projectIds = projects.Select(p => p.Id).ToHashSet();

        IEnumerable<ScoreSnapshotRow> current = projects
            .Where(p => p.HealthScore != null)
            .Select(p => new ScoreSnapshotRow(p.Id, today, p.HealthScore!.Value));

        return
        [
            .. stored.Where(s => projectIds.Contains(s.ProjectId) && s.Day < today),
            .. current,
        ];
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
