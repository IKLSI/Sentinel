using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Billing;
using Sentinel.Domain.Entities;
using Stripe;
using CheckoutSession = Stripe.Checkout.Session;
using PlanTier = Sentinel.Domain.Entities.PlanTier;

namespace Sentinel.Infrastructure.Payments;

public class StripeWebhookParser(
    IOptions<StripeSettings> stripeOptions,
    ILogger<StripeWebhookParser> logger) : IBillingWebhookParser
{
    private const string CheckoutCompletedType = "checkout.session.completed";
    private const string SubscriptionCreatedType = "customer.subscription.created";
    private const string SubscriptionUpdatedType = "customer.subscription.updated";
    private const string SubscriptionDeletedType = "customer.subscription.deleted";
    private const string InvoicePaymentFailedType = "invoice.payment_failed";
    private const string InvoicePaidType = "invoice.paid";

    private readonly StripeSettings _stripe = stripeOptions.Value;

    public BillingWebhookEvent? ParseOrDefault(string payload, string signature)
    {
        if (string.IsNullOrEmpty(_stripe.WebhookSecret))
            throw new InvalidOperationException("Stripe:WebhookSecret is missing");

        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(payload, signature, _stripe.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException exception)
        {
            logger.LogWarning(exception, "Invalid Stripe webhook");

            return null;
        }

        return new BillingWebhookEvent
        {
            Id = stripeEvent.Id,
            RawType = stripeEvent.Type,
            CreatedAt = stripeEvent.Created,
            Type = ResolveType(stripeEvent),
            Checkout = stripeEvent.Data.Object is CheckoutSession session ? ToCheckout(session) : null,
            Subscription = stripeEvent.Data.Object is Subscription subscription ? ToSnapshot(subscription) : null,
            Invoice = stripeEvent.Data.Object is Invoice invoice ? ToInvoice(invoice) : null
        };
    }

    private static BillingWebhookEventType ResolveType(Event stripeEvent) => stripeEvent.Type switch
    {
        CheckoutCompletedType => BillingWebhookEventType.CheckoutCompleted,
        SubscriptionCreatedType or SubscriptionUpdatedType => BillingWebhookEventType.SubscriptionChanged,
        SubscriptionDeletedType => BillingWebhookEventType.SubscriptionCanceled,
        InvoicePaymentFailedType => BillingWebhookEventType.InvoicePaymentFailed,
        InvoicePaidType => BillingWebhookEventType.InvoicePaid,
        _ => BillingWebhookEventType.Unhandled
    };

    private static BillingCheckoutCompleted ToCheckout(CheckoutSession session) => new(
        Guid.TryParse(session.ClientReferenceId, out Guid organizationId) ? organizationId : null,
        session.CustomerId,
        session.SubscriptionId,
        ReadTier(session));

    private static PlanTier? ReadTier(CheckoutSession session) =>
        session.Metadata != null
        && session.Metadata.TryGetValue(StripeMetadataKeys.PlanTier, out string? tierValue)
        && Enum.TryParse(tierValue, out PlanTier tier)
            ? tier
            : null;

    private static BillingInvoiceEvent ToInvoice(Invoice invoice) => new(
        invoice.CustomerId,
        invoice.Parent?.SubscriptionDetails?.SubscriptionId,
        invoice.AmountDue / 100m,
        invoice.AmountPaid / 100m,
        invoice.Currency,
        invoice.HostedInvoiceUrl);

    private static BillingSubscriptionSnapshot ToSnapshot(Subscription subscription) => new(
        subscription.Id,
        subscription.CustomerId,
        MapStatus(subscription.Status),
        subscription.Items?.Data?.FirstOrDefault()?.Price?.Id);

    private static SubscriptionStatus MapStatus(string status) => status switch
    {
        "active" => SubscriptionStatus.Active,
        "trialing" => SubscriptionStatus.Trialing,
        "past_due" => SubscriptionStatus.PastDue,
        "canceled" or "unpaid" => SubscriptionStatus.Canceled,
        "incomplete" or "incomplete_expired" => SubscriptionStatus.Incomplete,
        _ => SubscriptionStatus.None
    };
}
