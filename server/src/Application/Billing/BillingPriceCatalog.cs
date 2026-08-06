using Microsoft.Extensions.Options;
using Sentinel.Application.Common;
using Sentinel.Application.Options;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Billing;

public class BillingPriceCatalog(IOptions<StripePrices> priceOptions)
{
    private readonly StripePrices _prices = priceOptions.Value;

    public (PlanTier Tier, string? MonthlyId)[] PaidTiers =>
    [
        (PlanTier.Pro, _prices.Pro),
        (PlanTier.Business, _prices.Business)
    ];

    public Result<string> PriceIdFor(PlanTier tier)
    {
        string? priceId = tier switch
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
        if (priceId == _prices.Pro) return PlanTier.Pro;
        if (priceId == _prices.Business) return PlanTier.Business;

        return null;
    }
}
