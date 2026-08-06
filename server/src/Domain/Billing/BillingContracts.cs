using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Billing;

public sealed record BillingCustomerRequest(Guid OrganizationId, string OrganizationName, string? AdminEmail);

public sealed record BillingCheckoutRequest(
    Guid OrganizationId,
    string CustomerId,
    string PriceId,
    PlanTier Tier,
    string SuccessUrl,
    string CancelUrl);

public enum BillingWebhookEventType
{
    Unhandled,
    CheckoutCompleted,
    SubscriptionChanged,
    SubscriptionCanceled,
    InvoicePaymentFailed,
    InvoicePaid
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

public sealed record BillingInvoiceEvent(
    string? CustomerId,
    string? SubscriptionId,
    decimal? AmountDue,
    decimal? AmountPaid,
    string? Currency,
    string? HostedInvoiceUrl);

public sealed class BillingWebhookEvent
{
    public required string Id { get; init; }
    public required string RawType { get; init; }
    public required BillingWebhookEventType Type { get; init; }
    public required DateTime CreatedAt { get; init; }
    public BillingCheckoutCompleted? Checkout { get; init; }
    public BillingSubscriptionSnapshot? Subscription { get; init; }
    public BillingInvoiceEvent? Invoice { get; init; }
}
