using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class PurgeExpiredRevokedTokensJob(
    IRevokedTokenRepository revokedTokenRepository,
    IProcessedStripeEventRepository processedStripeEventRepository,
    IRealtimeNotifier realtimeNotifier,
    ILogger<PurgeExpiredRevokedTokensJob> logger,
    ISystemScope systemScope)
{
    private static readonly TimeSpan ProcessedStripeEventRetention = TimeSpan.FromDays(30);

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        try
        {
            int deletedTokens = await revokedTokenRepository.DeleteExpiredAsync(cancellationToken);

            int deletedEvents = await processedStripeEventRepository.DeleteProcessedBeforeAsync(
                DateTime.UtcNow - ProcessedStripeEventRetention, cancellationToken);

            logger.LogInformation(
                "Purge completed: {TokenCount} expired revoked token(s), {EventCount} archived Stripe event(s)",
                deletedTokens, deletedEvents);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to purge expired records");
        }
        finally
        {
            await realtimeNotifier.NotifyAllAsync(new RealtimeEvent(RealtimeResources.Jobs),
                CancellationToken.None);
        }
    }
}
