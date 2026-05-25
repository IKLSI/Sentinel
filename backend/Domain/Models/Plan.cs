namespace Sentinel.Domain.Models;

public enum PlanTier
{
    Free,
    Pro,
    Business
}

public enum SubscriptionStatus
{
    None,
    Trialing,
    Active,
    PastDue,
    Canceled,
    Incomplete
}

public record PlanLimits(int MaxProjects, int MaxMembers, int MaxScansPerMonth, decimal PriceMonthly = 0m)
{
    public const int Unlimited = -1;

    public static readonly IReadOnlyDictionary<PlanTier, PlanLimits> ByTier = new Dictionary<PlanTier, PlanLimits>
    {
        [PlanTier.Free] = new PlanLimits(MaxProjects: 3, MaxMembers: 2, MaxScansPerMonth: 10, PriceMonthly: 0m),
        [PlanTier.Pro] = new PlanLimits(MaxProjects: 20, MaxMembers: 10, MaxScansPerMonth: 200, PriceMonthly: 29m),
        [PlanTier.Business] = new PlanLimits(MaxProjects: Unlimited, MaxMembers: Unlimited, MaxScansPerMonth: 2000, PriceMonthly: 99m)
    };

    public static PlanLimits For(PlanTier tier) => ByTier[tier];

    public static bool IsWithin(int current, int max) => max == Unlimited || current < max;
}
