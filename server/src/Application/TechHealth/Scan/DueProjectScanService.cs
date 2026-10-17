using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.Scan;

public class DueProjectScanService(
    IProjectRepository projectRepository,
    IJobScheduler jobs,
    ILogger<DueProjectScanService> logger)
{
    private static readonly TimeSpan DueMargin = TimeSpan.FromHours(6);
    private static readonly TimeSpan ScanSpacing = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan ScanWindow = TimeSpan.FromHours(2);

    public async Task ScheduleAllDueAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<Guid> daily = await ListDueAsync(ScanFrequency.Daily, 1, cancellationToken);
        IReadOnlyList<Guid> weekly = await ListDueAsync(ScanFrequency.Weekly, 7, cancellationToken);
        IReadOnlyList<Guid> monthly = await ListDueAsync(ScanFrequency.Monthly, 30, cancellationToken);

        List<Guid> dueProjectIds = daily.Concat(weekly).Concat(monthly).ToList();

        TimeSpan spacing = SpacingFor(dueProjectIds.Count);

        for (int index = 0; index < dueProjectIds.Count; index++)
        {
            Guid projectId = dueProjectIds[index];
            jobs.Schedule<ProjectScanService>(service => service.ScanProjectAsync(projectId), spacing * index);
        }

        logger.LogInformation("{Count} due project scans scheduled", dueProjectIds.Count);
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
