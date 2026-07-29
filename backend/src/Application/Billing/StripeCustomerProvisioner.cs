using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Stripe;

namespace Sentinel.Application.Billing;

public class StripeCustomerProvisioner(
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    IStripeClient stripeClient)
{
    public async Task<string> EnsureCustomerAsync(Organization organization, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(organization.StripeCustomerId))
            return organization.StripeCustomerId;

        string? adminEmail = await userRepository
            .GetOldestActiveAdminEmailAsync(organization.Id, cancellationToken);

        CustomerCreateOptions options = new CustomerCreateOptions
        {
            Name = organization.Name,
            Email = adminEmail,
            Metadata = new Dictionary<string, string>
            {
                [StripeMetadataKeys.OrganizationId] = organization.Id.ToString()
            }
        };

        Customer customer = await new CustomerService(stripeClient).CreateAsync(options, cancellationToken: cancellationToken);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            organization.StripeCustomerId = customer.Id;
            await commitScope.CommitAsync(cancellationToken);
        }

        return customer.Id;
    }
}
