using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing.GetPlans;

public class BillingPlanListService(
    IOrganizationRepository organizationRepository,
    BillingPriceCatalog priceCatalog,
    IBillingGateway billingGateway,
    IMemoryCache cache,
    ITenantContext tenant) : IService
{
    private const string PriceCacheKey = "stripe:prices:v2";
    private static readonly TimeSpan PriceCacheDuration = TimeSpan.FromHours(6);

    public async Task<Result<List<PlanOptionDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<PlanOptionDto>>.Unauthorized();

        PlanTier currentTier = await organizationRepository
            .GetEffectivePlanTierOrDefaultAsync(organizationId, cancellationToken);

        Dictionary<PlanTier, (decimal Monthly, decimal Annual)> prices = await GetPricesAsync(cancellationToken);

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

    private async Task<Dictionary<PlanTier, (decimal Monthly, decimal Annual)>> GetPricesAsync(
        CancellationToken cancellationToken)
    {
        return await cache.GetOrCreateAsync(PriceCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = PriceCacheDuration;
            entry.Size = 1;

            Dictionary<PlanTier, (decimal Monthly, decimal Annual)> prices = [];

            foreach ((PlanTier tier, string? monthlyId, string? annualId) in priceCatalog.PaidTiers)
            {
                prices[tier] = (
                    await ReadAmountAsync(monthlyId, cancellationToken),
                    await ReadAmountAsync(annualId, cancellationToken));
            }

            return prices;
        }) ?? [];
    }

    private async Task<decimal> ReadAmountAsync(string? priceId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(priceId)) return 0m;

        return await billingGateway.GetPriceAmountOrDefaultAsync(priceId, cancellationToken) ?? 0m;
    }
}
