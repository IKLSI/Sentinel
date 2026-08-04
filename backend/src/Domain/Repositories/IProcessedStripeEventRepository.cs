using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IProcessedStripeEventRepository : ICrudEntityWithIdRepository<ProcessedStripeEvent>
{
    Task<bool> TryClaimAsync(string stripeEventId, DateTime staleClaimThreshold,
        CancellationToken cancellationToken);

    Task MarkCompletedAsync(string stripeEventId, CancellationToken cancellationToken);

    Task ReleaseAsync(string stripeEventId, CancellationToken cancellationToken);

    Task<int> DeleteProcessedBeforeAsync(DateTime threshold, CancellationToken cancellationToken);
}
