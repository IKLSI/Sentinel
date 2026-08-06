using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IOrganizationRepository : ICrudEntityWithIdRepository<Organization>
{
    Task<bool> ExistsBySlugAsync(string slug, CancellationToken cancellationToken);

    Task<Organization?> GetOrDefaultByStripeReferenceAsync(string subscriptionId, string? customerId,
        CancellationToken cancellationToken);

    Task<PlanTier> GetEffectivePlanTierOrDefaultAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<bool> TryConsumeScanQuotaAsync(Guid organizationId, int maxScansPerMonth,
        CancellationToken cancellationToken);

    Task RefundScanQuotaAsync(Guid organizationId, CancellationToken cancellationToken);

    Task ResetScanPeriodIfElapsedAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<DateTime> GetScanPeriodStartOrDefaultAsync(Guid organizationId, CancellationToken cancellationToken);

    Task LockForUpdateAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<int> AllocateTicketNumberAsync(Guid organizationId, CancellationToken cancellationToken);
}
