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

    public Task<PlanTier> GetPlanTierOrDefaultAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(o => o.Id == organizationId)
            .Select(o => o.PlanTier)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<SubscriptionStatus> GetSubscriptionStatusOrDefaultAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(o => o.Id == organizationId)
            .Select(o => o.SubscriptionStatus)
            .FirstOrDefaultAsync(cancellationToken);

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
}
