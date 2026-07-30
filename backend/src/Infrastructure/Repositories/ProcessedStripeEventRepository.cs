using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class ProcessedStripeEventRepository
    : CrudEntityWithIdRepository<ProcessedStripeEvent>, IProcessedStripeEventRepository
{
    public ProcessedStripeEventRepository(SentinelContext context) : base(context) { }

    public async Task<bool> TryClaimAsync(string stripeEventId, string eventType, CancellationToken cancellationToken)
    {
        int inserted = await Context.Database.ExecuteSqlAsync(
            $"""
             INSERT INTO "ProcessedStripeEvents" ("Id", "StripeEventId", "EventType", "ProcessedAt")
             VALUES ({Guid.NewGuid()}, {stripeEventId}, {eventType}, {DateTime.UtcNow})
             ON CONFLICT ("StripeEventId") DO NOTHING
             """,
            cancellationToken);

        return inserted > 0;
    }

    public Task ReleaseAsync(string stripeEventId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(processed => processed.StripeEventId == stripeEventId)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteProcessedBeforeAsync(DateTime threshold, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(processed => processed.ProcessedAt < threshold)
            .ExecuteDeleteAsync(cancellationToken);
}
