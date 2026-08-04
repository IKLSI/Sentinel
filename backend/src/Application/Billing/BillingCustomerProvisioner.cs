using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Billing;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing;

public class BillingCustomerProvisioner(
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    IBillingGateway billingGateway)
{
    public async Task<string> EnsureCustomerAsync(Organization organization, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(organization.StripeCustomerId))
            return organization.StripeCustomerId;

        string? adminEmail = await userRepository
            .GetOldestActiveAdminEmailAsync(organization.Id, cancellationToken);

        string customerId = await billingGateway.CreateCustomerAsync(
            new BillingCustomerRequest(organization.Id, organization.Name, adminEmail), cancellationToken);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            organization.StripeCustomerId = customerId;
            await commitScope.CommitAsync(cancellationToken);
        }

        return customerId;
    }
}
