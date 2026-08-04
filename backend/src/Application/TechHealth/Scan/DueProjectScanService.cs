using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.Scan;

public class DueProjectScanService(
    IProjectRepository projectRepository,
    IScopedServiceRunner scopeRunner,
    ILogger<DueProjectScanService> logger)
{
    private const int MaxConcurrentScans = 5;

    public async Task ScanAllDueAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<Guid> daily = await ListDueAsync(ScanFrequency.Daily, 1, cancellationToken);
        IReadOnlyList<Guid> weekly = await ListDueAsync(ScanFrequency.Weekly, 7, cancellationToken);
        IReadOnlyList<Guid> monthly = await ListDueAsync(ScanFrequency.Monthly, 30, cancellationToken);

        using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentScans);

        await Task.WhenAll(daily.Concat(weekly).Concat(monthly).Select(async projectId =>
        {
            await throttle.WaitAsync(cancellationToken);
            try
            {
                await scopeRunner.RunAsync<ProjectScanService>(service => service.ScanProjectAsync(projectId));
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Project {ProjectId} scan failed", projectId);
            }
            finally
            {
                throttle.Release();
            }
        }));
    }

    private Task<IReadOnlyList<Guid>> ListDueAsync(ScanFrequency frequency, int elapsedDays,
        CancellationToken cancellationToken)
    {
        DateTime threshold = DateTime.UtcNow.AddDays(-elapsedDays);

        return projectRepository.ListIdsDueForScanAsync(frequency, threshold, cancellationToken);
    }
}
