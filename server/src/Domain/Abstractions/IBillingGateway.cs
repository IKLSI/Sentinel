using Sentinel.Domain.Billing;

namespace Sentinel.Domain.Abstractions;

public interface IBillingGateway
{
    Task<string> CreateCustomerAsync(BillingCustomerRequest request, CancellationToken cancellationToken);

    Task<string> CreateCheckoutSessionAsync(BillingCheckoutRequest request, CancellationToken cancellationToken);

    Task<decimal?> GetPriceAmountOrDefaultAsync(string priceId, CancellationToken cancellationToken);
}
