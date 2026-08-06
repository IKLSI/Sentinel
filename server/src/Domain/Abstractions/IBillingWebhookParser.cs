using Sentinel.Domain.Billing;

namespace Sentinel.Domain.Abstractions;

public interface IBillingWebhookParser
{
    BillingWebhookEvent? ParseOrDefault(string payload, string signature);
}
