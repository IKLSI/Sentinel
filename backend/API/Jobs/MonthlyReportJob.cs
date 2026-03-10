using TMAflow.Application.Services;

namespace TMAflow.API.Jobs;

public class MonthlyReportJob
{
    private readonly ReportService _reportService;
    private readonly ILogger<MonthlyReportJob> _logger;

    public MonthlyReportJob(ReportService reportService, ILogger<MonthlyReportJob> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        DateTime previousMonth = DateTime.UtcNow.AddMonths(-1);
        string period = $"{previousMonth.Year:D4}-{previousMonth.Month:D2}";

        _logger.LogInformation("Génération des rapports mensuels pour la période {Period}", period);

        try
        {
            await _reportService.GenerateAndSendAllMonthlyReportsAsync(period);
            _logger.LogInformation("Rapports mensuels générés et envoyés pour la période {Period}", period);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la génération des rapports mensuels pour {Period}", period);
            throw;
        }
    }
}
