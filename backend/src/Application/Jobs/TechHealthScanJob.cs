using Microsoft.Extensions.Logging;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.Jobs;

public class TechHealthScanJob(
    TechHealthService techHealthService,
    ILogger<TechHealthScanJob> logger,
    ISystemScope systemScope)
{

    public async Task ExecuteAsync()
    {
        using IDisposable elevation = systemScope.Enter();

        logger.LogInformation("Scan de santé technologique démarré");

        try
        {
            await techHealthService.ScanAllProjectsDueAsync();
            logger.LogInformation("Scan de santé technologique terminé");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erreur lors du scan de santé technologique");
        }
    }
}
