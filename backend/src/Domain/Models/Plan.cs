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

public record PlanLimits(int MaxProjects, int MaxMembers, int MaxScansPerMonth)
{
    public const int Unlimited = -1;

    public static readonly IReadOnlyDictionary<PlanTier, PlanLimits> ByTier = new Dictionary<PlanTier, PlanLimits>
    {
        [PlanTier.Free] = new PlanLimits(MaxProjects: 3, MaxMembers: 2, MaxScansPerMonth: 10),
        [PlanTier.Pro] = new PlanLimits(MaxProjects: 20, MaxMembers: 10, MaxScansPerMonth: 200),
        [PlanTier.Business] = new PlanLimits(MaxProjects: Unlimited, MaxMembers: Unlimited, MaxScansPerMonth: 2000)
    };

    public static PlanLimits For(PlanTier tier) => ByTier[tier];

    public static bool IsWithin(int current, int max) => max == Unlimited || current < max;
}
