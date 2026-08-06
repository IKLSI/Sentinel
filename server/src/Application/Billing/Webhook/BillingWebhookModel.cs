namespace Sentinel.Application.Billing.Webhook;

public class BillingWebhookModel
{
    public required string Payload { get; init; }
    public required string Signature { get; init; }
}
