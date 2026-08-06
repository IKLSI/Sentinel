using Microsoft.Extensions.Options;
using Sentinel.Application.Common;
using Sentinel.Application.Options;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Billing;

public class BillingPriceCatalog(IOptions<StripePrices> priceOptions)
{
    private const string AnnualInterval = "annual";

    private readonly StripePrices _prices = priceOptions.Value;

    public (PlanTier Tier, string? MonthlyId, string? AnnualId)[] PaidTiers =>
    [
        (PlanTier.Pro, _prices.Pro, _prices.ProAnnual),
        (PlanTier.Business, _prices.Business, _prices.BusinessAnnual)
    ];

    public Result<string> PriceIdFor(PlanTier tier, string billingInterval)
    {
        string? priceId = billingInterval == AnnualInterval
            ? tier switch
            {
                PlanTier.Pro => _prices.ProAnnual,
                PlanTier.Business => _prices.BusinessAnnual,
                _ => null
            }
            : tier switch
            {
                PlanTier.Pro => _prices.Pro,
                PlanTier.Business => _prices.Business,
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
        if (priceId == _prices.Pro || priceId == _prices.ProAnnual) return PlanTier.Pro;
        if (priceId == _prices.Business || priceId == _prices.BusinessAnnual) return PlanTier.Business;

        return null;
    }
}
