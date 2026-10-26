using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public static class FindingRules
{
    public const int ApproachingEolWindowDays = 90;

    private static readonly TimeSpan ApproachingEolWindow = TimeSpan.FromDays(ApproachingEolWindowDays);

    public static bool IsOutdated(Dependency dependency) =>
        dependency.IsDeprecated || UpdateStatusOf(dependency) != DependencyStatus.UpToDate;

    public static bool IsMajorUpdateInProduction(Dependency dependency) =>
        dependency.Status == DependencyStatus.MajorUpdate && dependency.IsDirect
        && dependency.Type == DependencyType.Prod;

    public static DependencyStatus UpdateStatusOf(Dependency dependency) =>
        DependencyStatusCalculator.UpdateOf(dependency);

    public static bool IsEol(RuntimeGroup group) => IsEffectivelyEol(group.MostAtRisk);

    public static bool IsEffectivelyEol(Runtime runtime) => runtime.IsEol == true && !runtime.IsMinimumConstraint;

    public static bool IsApproachingEol(Runtime runtime, DateTime now) =>
        !runtime.IsMinimumConstraint
        && runtime.IsEol != true
        && runtime.EolDate is DateTime eolDate
        && eolDate > now
        && eolDate - now <= ApproachingEolWindow;
}
