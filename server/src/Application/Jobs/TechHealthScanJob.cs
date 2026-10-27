using Sentinel.Application.Scanning;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.Application.Jobs;

public class TechHealthScanJob(
    DueProjectScanService dueProjectScanService,
    IRealtimeNotifier realtimeNotifier,
    ISystemScope systemScope)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        try
        {
            await dueProjectScanService.ScheduleAllDueAsync(cancellationToken);
        }
        finally
        {
            await realtimeNotifier.NotifyAllAsync(new RealtimeEvent(RealtimeResources.Jobs));
        }
    }
}
