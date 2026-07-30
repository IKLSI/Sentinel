using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class PurgeExpiredRevokedTokensJob(
    IRevokedTokenRepository revokedTokenRepository,
    IProcessedStripeEventRepository processedStripeEventRepository,
    ILogger<PurgeExpiredRevokedTokensJob> logger,
    ISystemScope systemScope)
{
    private static readonly TimeSpan ProcessedStripeEventRetention = TimeSpan.FromDays(30);

    public async Task ExecuteAsync()
    {
        using IDisposable elevation = systemScope.Enter();

        try
        {
            int deletedTokens = await revokedTokenRepository.DeleteExpiredAsync(CancellationToken.None);

            int deletedEvents = await processedStripeEventRepository.DeleteProcessedBeforeAsync(
                DateTime.UtcNow - ProcessedStripeEventRetention, CancellationToken.None);

            logger.LogInformation(
                "Purge terminée : {TokenCount} token(s) révoqué(s) expiré(s), {EventCount} événement(s) Stripe archivé(s)",
                deletedTokens, deletedEvents);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erreur lors de la purge des enregistrements expirés");
        }
    }
}
