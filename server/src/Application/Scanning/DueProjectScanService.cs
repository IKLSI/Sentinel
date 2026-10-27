using Microsoft.Extensions.Logging;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Scanning;

public class DueProjectScanService(
    IProjectRepository projectRepository,
    IJobScheduler jobs,
    ProjectScanGate scanGate,
    ScanProgressTracker scanProgress,
    ILogger<DueProjectScanService> logger)
{
    private static readonly TimeSpan DueMargin = TimeSpan.FromHours(6);
    private static readonly TimeSpan ScanSpacing = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan ScanWindow = TimeSpan.FromHours(2);

    public Task<int> ScheduleAllDueAsync(CancellationToken cancellationToken) =>
        ScheduleDueAsync(cancellationToken);

    public async Task<int> ScheduleAllForOrganizationAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        IReadOnlyList<Guid> projectIds =
            await projectRepository.ListIdsByOrganizationAsync(organizationId, cancellationToken);

        int queuedCount = 0;

        foreach (Guid projectId in projectIds)
        {
            ScanQueueing queueing = scanGate.Queue(projectId);
            if (queueing == ScanQueueing.AlreadyPending) continue;

            scanProgress.Report(projectId, organizationId, ScanStage.Queued);
            if (queueing == ScanQueueing.NewJob)
                jobs.Enqueue<ProjectScanService>(JobQueues.Scans, service => service.ScanProjectAsync(projectId,
                    CancellationToken.None));

            queuedCount++;
        }

        logger.LogInformation("{Count} project scans queued for organization {OrganizationId}",
            queuedCount, organizationId);

        return queuedCount;
    }

    private async Task<int> ScheduleDueAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<Guid> daily = await ListDueAsync(ScanFrequency.Daily, 1, cancellationToken);
        IReadOnlyList<Guid> weekly = await ListDueAsync(ScanFrequency.Weekly, 7, cancellationToken);
        IReadOnlyList<Guid> monthly = await ListDueAsync(ScanFrequency.Monthly, 30, cancellationToken);

        List<Guid> dueProjectIds = daily.Concat(weekly).Concat(monthly)
            .Where(projectId => scanGate.Queue(projectId) == ScanQueueing.NewJob)
            .ToList();

        TimeSpan spacing = SpacingFor(dueProjectIds.Count);

        for (int index = 0; index < dueProjectIds.Count; index++)
        {
            Guid projectId = dueProjectIds[index];
            jobs.Schedule<ProjectScanService>(JobQueues.Scans, service => service.ScanProjectAsync(projectId, CancellationToken.None),
                spacing * index);
        }

        logger.LogInformation("{Count} due project scans scheduled", dueProjectIds.Count);

        return dueProjectIds.Count;
    }

    private static TimeSpan SpacingFor(int count) =>
        count <= 1 ? ScanSpacing : TimeSpan.FromTicks(Math.Min(ScanSpacing.Ticks, ScanWindow.Ticks / (count - 1)));

    private Task<IReadOnlyList<Guid>> ListDueAsync(ScanFrequency frequency, int elapsedDays,
        CancellationToken cancellationToken)
    {
        DateTime threshold = DateTime.UtcNow.AddDays(-elapsedDays).Add(DueMargin);

        return projectRepository.ListIdsDueForScanAsync(frequency, threshold, cancellationToken);
    }
}
