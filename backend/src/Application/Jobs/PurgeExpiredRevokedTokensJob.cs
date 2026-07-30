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
                "Purge completed: {TokenCount} expired revoked token(s), {EventCount} archived Stripe event(s)",
                deletedTokens, deletedEvents);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to purge expired records");
        }
    }
}
