using Sentinel.Application.Services;

namespace Sentinel.API.Jobs;

public class TechHealthScanJob
{
    private readonly TechHealthService _techHealthService;
    private readonly ILogger<TechHealthScanJob> _logger;

    public TechHealthScanJob(TechHealthService techHealthService, ILogger<TechHealthScanJob> logger)
    {
        _techHealthService = techHealthService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Scan de santé technologique démarré");

        try
        {
            await _techHealthService.ScanAllProjectsDueAsync();
            _logger.LogInformation("Scan de santé technologique terminé");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du scan de santé technologique");
            throw;
        }
    }
}
