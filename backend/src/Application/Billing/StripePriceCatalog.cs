using Microsoft.Extensions.Options;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Billing;

public class StripePriceCatalog
{
    private const string AnnualInterval = "annual";

    private readonly StripeSettings _stripe;

    public StripePriceCatalog(IOptions<StripeSettings> stripeOptions)
    {
        _stripe = stripeOptions.Value;
    }

    public (PlanTier Tier, string? MonthlyId, string? AnnualId)[] PaidTiers =>
    [
        (PlanTier.Pro, _stripe.Prices.Pro, _stripe.Prices.ProAnnual),
        (PlanTier.Business, _stripe.Prices.Business, _stripe.Prices.BusinessAnnual)
    ];

    public Result<string> PriceIdFor(PlanTier tier, string billingInterval)
    {
        string? priceId = billingInterval == AnnualInterval
            ? tier switch
            {
                PlanTier.Pro => _stripe.Prices.ProAnnual,
                PlanTier.Business => _stripe.Prices.BusinessAnnual,
                _ => null
            }
            : tier switch
            {
                PlanTier.Pro => _stripe.Prices.Pro,
                PlanTier.Business => _stripe.Prices.Business,
                _ => null
            };

        if (string.IsNullOrEmpty(priceId))
        {
            return Result<string>.Error(ErrorCodes.BillingPriceNotConfigured,
                new Dictionary<string, string> { ["plan"] = tier.ToString() });
        }

        return priceId;
    }

    public PlanTier? TierFor(string? priceId)
    {
        if (string.IsNullOrEmpty(priceId)) return null;
        if (priceId == _stripe.Prices.Pro || priceId == _stripe.Prices.ProAnnual) return PlanTier.Pro;
        if (priceId == _stripe.Prices.Business || priceId == _stripe.Prices.BusinessAnnual) return PlanTier.Business;

        return null;
    }

    public string WebhookSecret => _stripe.WebhookSecret;

    public static SubscriptionStatus MapStatus(string status) => status switch
    {
        "active" => SubscriptionStatus.Active,
        "trialing" => SubscriptionStatus.Trialing,
        "past_due" => SubscriptionStatus.PastDue,
        "canceled" or "unpaid" => SubscriptionStatus.Canceled,
        "incomplete" or "incomplete_expired" => SubscriptionStatus.Incomplete,
        _ => SubscriptionStatus.None
    };
}
