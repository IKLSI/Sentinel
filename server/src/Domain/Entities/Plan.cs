namespace Sentinel.Domain.Entities;

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

public record PlanLimits(int MaxProjects, int MaxMembers, int MaxScansPerMonth, ScanFrequency MaxScanFrequency,
    bool AllowsComplianceExports)
{
    public const int Unlimited = -1;

    public static readonly IReadOnlyDictionary<PlanTier, PlanLimits> ByTier = new Dictionary<PlanTier, PlanLimits>
    {
        [PlanTier.Free] = new PlanLimits(MaxProjects: 3, MaxMembers: 2, MaxScansPerMonth: 10,
            MaxScanFrequency: ScanFrequency.Monthly, AllowsComplianceExports: false),
        [PlanTier.Pro] = new PlanLimits(MaxProjects: 20, MaxMembers: 10, MaxScansPerMonth: 200,
            MaxScanFrequency: ScanFrequency.Weekly, AllowsComplianceExports: true),
        [PlanTier.Business] = new PlanLimits(MaxProjects: Unlimited, MaxMembers: Unlimited, MaxScansPerMonth: 2000,
            MaxScanFrequency: ScanFrequency.Daily, AllowsComplianceExports: true)
    };

    public static PlanLimits For(PlanTier tier) => ByTier[tier];

    public static bool IsEntitled(SubscriptionStatus status) =>
        status is SubscriptionStatus.Active or SubscriptionStatus.Trialing;

    public static PlanTier Effective(PlanTier tier, SubscriptionStatus status) =>
        tier == PlanTier.Free || IsEntitled(status) ? tier : PlanTier.Free;

    public static bool IsWithin(int current, int max) => max == Unlimited || current < max;

    public bool AllowsFrequency(ScanFrequency frequency) =>
        frequency == ScanFrequency.Manual || IntervalDays(frequency) >= IntervalDays(MaxScanFrequency);

    public IReadOnlyCollection<ScanFrequency> FrequenciesAbovePlan() =>
        Enum.GetValues<ScanFrequency>().Where(frequency => !AllowsFrequency(frequency)).ToArray();

    private static int IntervalDays(ScanFrequency frequency) => frequency switch
    {
        ScanFrequency.Daily => 1,
        ScanFrequency.Weekly => 7,
        ScanFrequency.Monthly => 30,
        _ => int.MaxValue
    };
}
