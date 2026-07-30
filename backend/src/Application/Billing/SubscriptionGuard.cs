using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing;

public class SubscriptionGuard(IOrganizationRepository organizationRepository)
{
    public async Task<Result> EnsureEntitledAsync(Guid organizationId, string errorCode,
        CancellationToken cancellationToken)
    {
        SubscriptionStatus status = await organizationRepository
            .GetSubscriptionStatusOrDefaultAsync(organizationId, cancellationToken);

        if (status is SubscriptionStatus.Active or SubscriptionStatus.Trialing)
            return Result.Success();

        return Result.PaymentRequired(errorCode);
    }
}
