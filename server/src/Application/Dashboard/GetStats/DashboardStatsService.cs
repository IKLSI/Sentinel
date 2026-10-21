using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsService(
    IDashboardRepository dashboardRepository,
    IProjectRepository projectRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    DashboardCache dashboardCache,
    ITenantContext tenant) : IService
{
    private const int ActivityCount = 8;
    private const int ProjectRowCount = 5;
    private const int UrgentTicketCount = 8;
    private const int WindowDays = 30;

    public async Task<Result<DashboardStatsDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || organizationId == Guid.Empty)
            return Result<DashboardStatsDto>.Unauthorized();

        if (dashboardCache.TryGet(organizationId, out DashboardStatsDto? cached))
            return cached!;

        long version = dashboardCache.VersionOf(organizationId);

        DashboardStatsDto stats = await BuildAsync(organizationId, cancellationToken);

        dashboardCache.Store(organizationId, version, stats);

        return stats;
    }

    private async Task<DashboardStatsDto> BuildAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        DateTime now = DateTime.UtcNow;
        DateOnly today = DateOnly.FromDateTime(now);
        DateOnly windowStart = today.AddDays(-(WindowDays - 1));
        DateTime windowStartAt = windowStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        IReadOnlyList<DashboardProjectRow> projects =
            await dashboardRepository.GetProjectsAsync(organizationId, cancellationToken);
        IReadOnlyList<DashboardRuntimeRow> runtimes =
            await dashboardRepository.GetRuntimesAsync(organizationId, cancellationToken);
        VulnerabilityTotalsRow vulnerabilityTotals =
            await dashboardRepository.GetVulnerabilityTotalsAsync(organizationId, cancellationToken);
        DependencyTotalsRow dependencyTotals =
            await dashboardRepository.GetDependencyTotalsAsync(organizationId, cancellationToken);
        IReadOnlyList<OpenTicketRow> openTickets = await dashboardRepository.GetOpenTicketsAsync(organizationId,
            cancellationToken);
        IReadOnlyList<ScoreSnapshotRow> snapshots = await LoadSnapshotsAsync(organizationId, projects, windowStart,
            today, cancellationToken);
        VulnerabilityFlowCountsRow flowCounts = await dashboardRepository
            .GetVulnerabilityFlowCountsAsync(organizationId, windowStartAt, cancellationToken);
        List<ActivityItemDto> recentActivity = await BuildRecentActivityAsync(organizationId, now, cancellationToken);
        List<UrgentTicketDto> urgentTickets = await BuildUrgentTicketsAsync(organizationId, cancellationToken);

        IReadOnlyList<RuntimeDeadline> deadlines = RuntimeDeadlineCalculator.Compute(runtimes, today);
        List<Guid> priorityIds = ProjectHealthBuilder.SelectPriorityIds(projects, ProjectRowCount);
        IReadOnlyList<Project> priorityProjects = await projectRepository.ListScoringGraphsByIdsAsync(
            organizationId, priorityIds, cancellationToken);
        Dictionary<Guid, HashSet<Guid>> suppressedIdsByProject =
            await LoadSuppressedIdsAsync(priorityProjects, now, cancellationToken);
        List<ScorePointDto> scoreHistory = ScoreHistoryBuilder.Build(snapshots, windowStart, today);

        return new DashboardStatsDto
        {
            Overview = ParkOverviewCalculator.Build(projects, vulnerabilityTotals, dependencyTotals, deadlines,
                ScoreHistoryBuilder.Delta(scoreHistory)),
            ScoreHistory = scoreHistory,
            VulnerabilityFlow = VulnerabilityFlowBuilder.Build(flowCounts.Opened, flowCounts.ResolvedDetections,
                flowCounts.Resolutions, windowStart, today),
            UrgentTickets = urgentTickets,
            Projects = ProjectHealthBuilder.Build(priorityIds, priorityProjects,
                ScoreHistoryBuilder.ScoresAt(snapshots, windowStart), openTickets, deadlines, suppressedIdsByProject),
            RecentActivity = recentActivity,
        };
    }

    private async Task<Dictionary<Guid, HashSet<Guid>>> LoadSuppressedIdsAsync(IReadOnlyList<Project> projects,
        DateTime now, CancellationToken cancellationToken)
    {
        Dictionary<Guid, HashSet<Guid>> suppressedIdsByProject = new();

        foreach (Project project in projects)
        {
            IReadOnlyList<VulnerabilitySuppression> suppressions =
                await suppressionRepository.ListActiveByProjectAsync(project.Id, now, cancellationToken);

            suppressedIdsByProject[project.Id] = SuppressedVulnerabilities.IdsIn(project,
                suppressions.Select(suppression => suppression.FindingKey).ToHashSet());
        }

        return suppressedIdsByProject;
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

    private async Task<IReadOnlyList<ScoreSnapshotRow>> LoadSnapshotsAsync(Guid organizationId,
        IReadOnlyList<DashboardProjectRow> projects, DateOnly windowStart, DateOnly today,
        CancellationToken cancellationToken)
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
