using Microsoft.Extensions.Logging;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.Application.Jobs;

public class TechHealthScanJob(
    DueProjectScanService dueProjectScanService,
    IRealtimeNotifier realtimeNotifier,
    ILogger<TechHealthScanJob> logger,
    ISystemScope systemScope)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        try
        {
            await dueProjectScanService.ScheduleAllDueAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Tech health scan scheduling failed");
        }
        finally
        {
            await realtimeNotifier.NotifyAllAsync(new RealtimeEvent(RealtimeResources.Jobs));
        }
    }
}
