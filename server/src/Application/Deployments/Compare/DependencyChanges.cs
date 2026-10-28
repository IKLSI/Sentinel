using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.Deployments.Compare;

public sealed record DependencyChange(Dependency? Base, Dependency? Head, DependencyChangeKind Kind, bool IsMajor)
{
    public Dependency Current => Head ?? Base!;
}

public static class DependencyChanges
{
    public static List<DependencyChange> Compare(IEnumerable<Dependency> baseDependencies,
        IEnumerable<Dependency> headDependencies)
    {
        Dictionary<(DependencyEcosystem, string), Dependency> before = IndexByIdentity(baseDependencies);
        Dictionary<(DependencyEcosystem, string), Dependency> after = IndexByIdentity(headDependencies);

        List<DependencyChange> changes = [];

        foreach ((DependencyEcosystem, string) identity in before.Keys.Union(after.Keys))
        {
            DependencyChange? change = CompareVersions(before.GetValueOrDefault(identity),
                after.GetValueOrDefault(identity));
            if (change != null) changes.Add(change);
        }

        return changes
            .OrderByDescending(change => change.Current.IsDirect)
            .ThenBy(change => change.Current.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static DependencyChange? CompareVersions(Dependency? previous, Dependency? current)
    {
        if (previous == null) return new DependencyChange(null, current, DependencyChangeKind.Added, false);
        if (current == null) return new DependencyChange(previous, null, DependencyChangeKind.Removed, false);

        string previousVersion = VersionText.Clean(previous.CurrentVersion);
        string currentVersion = VersionText.Clean(current.CurrentVersion);
        int comparison = VersionComparer.Instance.Compare(previousVersion, currentVersion);

        if (comparison == 0) return null;

        return comparison < 0
            ? new DependencyChange(previous, current, DependencyChangeKind.Upgraded,
                DependencyStatusCalculator.Compute(previousVersion, currentVersion) == DependencyStatus.MajorUpdate)
            : new DependencyChange(previous, current, DependencyChangeKind.Downgraded, false);
    }

    private static Dictionary<(DependencyEcosystem, string), Dependency> IndexByIdentity(
        IEnumerable<Dependency> dependencies) =>
        dependencies
            .GroupBy(DependencyIdentity.Of)
            .ToDictionary(group => group.Key, group => group.First());
}
