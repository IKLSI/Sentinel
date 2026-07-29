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
}
