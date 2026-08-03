using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class OrganizationRepository : CrudEntityWithIdRepository<Organization>, IOrganizationRepository
{
    public OrganizationRepository(SentinelContext context) : base(context) { }

    public Task<bool> ExistsBySlugAsync(string slug, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking).AnyAsync(o => o.Slug == slug, cancellationToken);

    public Task<Organization?> GetOrDefaultByStripeReferenceAsync(string subscriptionId, string? customerId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(o => o.StripeSubscriptionId == subscriptionId
                || (customerId != null && o.StripeCustomerId == customerId), cancellationToken);

    public async Task<PlanTier> GetEffectivePlanTierOrDefaultAsync(Guid organizationId,
        CancellationToken cancellationToken)
    {
        var subscription = await Query(QueryTracking.NoTracking)
            .Where(o => o.Id == organizationId)
            .Select(o => new { o.PlanTier, o.SubscriptionStatus })
            .FirstOrDefaultAsync(cancellationToken);

        return subscription == null
            ? PlanTier.Free
            : PlanLimits.Effective(subscription.PlanTier, subscription.SubscriptionStatus);
    }

    public async Task<bool> TryConsumeScanQuotaAsync(Guid organizationId, int maxScansPerMonth,
        CancellationToken cancellationToken)
    {
        int unlimited = PlanLimits.Unlimited;

        int updated = await Context.Database.ExecuteSqlAsync(
            $"""
             UPDATE "Organizations"
             SET "MonthlyScanCount" = CASE
                     WHEN "ScanCountPeriodStart" + interval '1 month' <= now() THEN 1
                     ELSE "MonthlyScanCount" + 1
                 END,
                 "ScanCountPeriodStart" = CASE
                     WHEN "ScanCountPeriodStart" + interval '1 month' <= now() THEN now()
                     ELSE "ScanCountPeriodStart"
                 END
             WHERE "Id" = {organizationId}
               AND (
                   {maxScansPerMonth} = {unlimited}
                   OR CASE
                          WHEN "ScanCountPeriodStart" + interval '1 month' <= now() THEN 0
                          ELSE "MonthlyScanCount"
                      END < {maxScansPerMonth}
               )
             """,
            cancellationToken);

        return updated > 0;
    }

    public Task RefundScanQuotaAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Context.Database.ExecuteSqlAsync(
            $"""
             UPDATE "Organizations"
             SET "MonthlyScanCount" = greatest("MonthlyScanCount" - 1, 0)
             WHERE "Id" = {organizationId}
             """,
            cancellationToken);

    public Task ResetScanPeriodIfElapsedAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Context.Database.ExecuteSqlAsync(
            $"""
             UPDATE "Organizations"
             SET "MonthlyScanCount" = 0,
                 "ScanCountPeriodStart" = now()
             WHERE "Id" = {organizationId}
               AND "ScanCountPeriodStart" + interval '1 month' <= now()
             """,
            cancellationToken);

    public Task<DateTime> GetScanPeriodStartOrDefaultAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(o => o.Id == organizationId)
            .Select(o => o.ScanCountPeriodStart)
            .FirstOrDefaultAsync(cancellationToken);

    public Task LockForUpdateAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Context.Database.ExecuteSqlAsync(
            $"""SELECT 1 FROM "Organizations" WHERE "Id" = {organizationId} FOR UPDATE""",
            cancellationToken);

    public async Task<int> AllocateTicketNumberAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        await Context.Database.ExecuteSqlAsync(
            $"""
             UPDATE "Organizations"
             SET "TicketCounter" = "TicketCounter" + 1
             WHERE "Id" = {organizationId}
             """,
            cancellationToken);

        return await Query(QueryTracking.NoTracking)
            .Where(o => o.Id == organizationId)
            .Select(o => o.TicketCounter)
            .FirstAsync(cancellationToken);
    }
}
