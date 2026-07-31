using Hangfire;
using Microsoft.Extensions.Logging;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.Jobs;

public class TechHealthScanJob(
    TechHealthService techHealthService,
    ILogger<TechHealthScanJob> logger,
    ISystemScope systemScope)
{
    public async Task ExecuteAsync(IJobCancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        logger.LogInformation("Tech health scan started");

        try
        {
            await techHealthService.ScanAllProjectsDueAsync(cancellationToken.ShutdownToken);
            logger.LogInformation("Tech health scan completed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Tech health scan failed");
        }
    }
}
