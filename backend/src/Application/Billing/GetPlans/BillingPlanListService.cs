using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Billing;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Stripe;
using PlanTier = Sentinel.Domain.Models.PlanTier;

namespace Sentinel.Application.Billing.GetPlans;

public class BillingPlanListService(
    IOrganizationRepository organizationRepository,
    StripePriceCatalog priceCatalog,
    IStripeClient stripeClient,
    IMemoryCache cache,
    ITenantContext tenant,
    ILogger<BillingPlanListService> logger) : IService
{
    private const string PriceCacheKey = "stripe:prices:v2";
    private static readonly TimeSpan PriceCacheDuration = TimeSpan.FromHours(6);

    public async Task<Result<List<PlanOptionDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<PlanOptionDto>>.Unauthorized();

        PlanTier currentTier = await organizationRepository
            .GetPlanTierOrDefaultAsync(organizationId, cancellationToken);

        Dictionary<PlanTier, (decimal Monthly, decimal Annual)> prices = await GetPricesAsync();

        return PlanLimits.ByTier.Select(entry =>
        {
            (decimal monthly, decimal annual) = prices.GetValueOrDefault(entry.Key, (0m, 0m));

            return new PlanOptionDto
            {
                Tier = entry.Key.ToString(),
                MaxProjects = entry.Value.MaxProjects,
                MaxMembers = entry.Value.MaxMembers,
                MaxScansPerMonth = entry.Value.MaxScansPerMonth,
                PriceMonthly = monthly,
                PriceAnnual = annual,
                IsCurrent = entry.Key == currentTier
            };
        }).ToList();
    }

    private async Task<Dictionary<PlanTier, (decimal Monthly, decimal Annual)>> GetPricesAsync()
    {
        return await cache.GetOrCreateAsync(PriceCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = PriceCacheDuration;
            entry.Size = 1;

            PriceService priceService = new PriceService(stripeClient);
            Dictionary<PlanTier, (decimal Monthly, decimal Annual)> prices = [];

            foreach ((PlanTier tier, string? monthlyId, string? annualId) in priceCatalog.PaidTiers)
            {
                prices[tier] = (
                    await ReadAmountAsync(priceService, monthlyId, tier, "mensuel"),
                    await ReadAmountAsync(priceService, annualId, tier, "annuel"));
            }

            return prices;
        }) ?? [];
    }

    private async Task<decimal> ReadAmountAsync(PriceService priceService, string? priceId, PlanTier tier, string label)
    {
        if (string.IsNullOrEmpty(priceId)) return 0m;

        try
        {
            Price price = await priceService.GetAsync(priceId);
            return (price.UnitAmount ?? 0) / 100m;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Unable to fetch Stripe price {Label} for {Tier}", label, tier);
            return 0m;
        }
    }
}
