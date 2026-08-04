using Microsoft.Extensions.Logging;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.Application.Jobs;

public class TechHealthScanJob(
    TechHealthService techHealthService,
    IRealtimeNotifier realtimeNotifier,
    ILogger<TechHealthScanJob> logger,
    ISystemScope systemScope)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        logger.LogInformation("Tech health scan started");

        try
        {
            await techHealthService.ScanAllProjectsDueAsync(cancellationToken);
            logger.LogInformation("Tech health scan completed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Tech health scan failed");
        }
        finally
        {
            await realtimeNotifier.NotifyAllAsync(new RealtimeEvent(RealtimeResources.Jobs),
                CancellationToken.None);
        }
    }
}
