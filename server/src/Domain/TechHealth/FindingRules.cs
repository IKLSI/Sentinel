using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public static class FindingRules
{
    public static bool IsOutdated(Dependency dependency) =>
        dependency.Status == DependencyStatus.EOL || UpdateStatusOf(dependency) != DependencyStatus.UpToDate;

    public static DependencyStatus UpdateStatusOf(Dependency dependency) =>
        DependencyStatusCalculator.Compute(dependency.CurrentVersion, dependency.LatestVersion);

    public static bool IsEol(RuntimeGroup group) => group.MostAtRisk.IsEol == true;
}
