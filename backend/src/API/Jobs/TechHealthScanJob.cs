using Sentinel.Application.Services;
using Sentinel.Domain.Abstractions;

namespace Sentinel.API.Jobs;

public class TechHealthScanJob
{
    private readonly TechHealthService _techHealthService;
    private readonly ILogger<TechHealthScanJob> _logger;
    private readonly ISystemScope _systemScope;

    public TechHealthScanJob(TechHealthService techHealthService, ILogger<TechHealthScanJob> logger, ISystemScope systemScope)
    {
        _techHealthService = techHealthService;
        _logger = logger;
        _systemScope = systemScope;
    }

    public async Task ExecuteAsync()
    {
        using IDisposable elevation = _systemScope.Enter();

        _logger.LogInformation("Scan de santé technologique démarré");

        try
        {
            await _techHealthService.ScanAllProjectsDueAsync();
            _logger.LogInformation("Scan de santé technologique terminé");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du scan de santé technologique");
        }
    }
}
