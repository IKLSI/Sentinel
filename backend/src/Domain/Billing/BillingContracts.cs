using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Billing;

public sealed record BillingCustomerRequest(Guid OrganizationId, string OrganizationName, string? AdminEmail);

public sealed record BillingCheckoutRequest(
    Guid OrganizationId,
    string CustomerId,
    string PriceId,
    PlanTier Tier,
    string BillingInterval,
    string SuccessUrl,
    string CancelUrl);

public enum BillingWebhookEventType
{
    Unhandled,
    CheckoutCompleted,
    SubscriptionChanged,
    SubscriptionCanceled
}

public sealed record BillingCheckoutCompleted(
    Guid? OrganizationId,
    string? CustomerId,
    string? SubscriptionId,
    PlanTier? Tier);

public sealed record BillingSubscriptionSnapshot(
    string SubscriptionId,
    string? CustomerId,
    SubscriptionStatus Status,
    string? PriceId);

public sealed class BillingWebhookEvent
{
    public required string Id { get; init; }
    public required BillingWebhookEventType Type { get; init; }
    public required DateTime CreatedAt { get; init; }
    public BillingCheckoutCompleted? Checkout { get; init; }
    public BillingSubscriptionSnapshot? Subscription { get; init; }
}
