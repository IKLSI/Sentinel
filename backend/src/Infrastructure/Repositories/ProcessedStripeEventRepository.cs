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

    public async Task<bool> TryClaimAsync(string stripeEventId, DateTime staleClaimThreshold,
        CancellationToken cancellationToken)
    {
        int claimed = await Context.Database.ExecuteSqlAsync(
            $"""
             INSERT INTO "ProcessedStripeEvents" ("Id", "StripeEventId", "ProcessedAt", "CompletedAt")
             VALUES ({Guid.NewGuid()}, {stripeEventId}, {DateTime.UtcNow}, NULL)
             ON CONFLICT ("StripeEventId") DO UPDATE
             SET "ProcessedAt" = EXCLUDED."ProcessedAt"
             WHERE "ProcessedStripeEvents"."CompletedAt" IS NULL
               AND "ProcessedStripeEvents"."ProcessedAt" < {staleClaimThreshold}
             """,
            cancellationToken);

        return claimed > 0;
    }

    public Task MarkCompletedAsync(string stripeEventId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(processed => processed.StripeEventId == stripeEventId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.CompletedAt, DateTime.UtcNow),
                cancellationToken);

    public Task ReleaseAsync(string stripeEventId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(processed => processed.StripeEventId == stripeEventId && processed.CompletedAt == null)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteProcessedBeforeAsync(DateTime threshold, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(processed => processed.CompletedAt != null && processed.ProcessedAt < threshold)
            .ExecuteDeleteAsync(cancellationToken);
}
