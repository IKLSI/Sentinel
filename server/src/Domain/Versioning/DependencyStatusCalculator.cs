using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Versioning;

public static class DependencyStatusCalculator
{
    private const int SemverCoreLength = 3;

    public static DependencyStatus For(Dependency dependency) => dependency.IsDeprecated
        ? DependencyStatus.EOL
        : UpdateOf(dependency);

    public static DependencyStatus UpdateOf(Dependency dependency)
    {
        DependencyStatus status = Compute(dependency.CurrentVersion, dependency.LatestVersion);

        return !dependency.IsVersionPinned && status == DependencyStatus.MinorUpdate
            ? DependencyStatus.UpToDate
            : status;
    }

    public static DependencyStatus Compute(string current, string? latest)
    {
        if (string.IsNullOrEmpty(latest) || string.IsNullOrEmpty(current)) return DependencyStatus.UpToDate;
        if (VersionComparer.Instance.Compare(current, latest) >= 0) return DependencyStatus.UpToDate;

        return IsBreakingUpgrade(CoreOf(current), CoreOf(latest))
            ? DependencyStatus.MajorUpdate
            : DependencyStatus.MinorUpdate;
    }

    private static bool IsBreakingUpgrade(int[] current, int[] latest)
    {
        if (latest[0] != current[0]) return latest[0] > current[0];
        if (current[0] > 0) return false;
        if (latest[1] != current[1]) return latest[1] > current[1];

        return current[1] == 0 && latest[2] > current[2];
    }

    private static int[] CoreOf(string version)
    {
        string[] parts = version.TrimStart('v', 'V').Split('.', '-', '+');

        return Enumerable.Range(0, SemverCoreLength)
            .Select(index => index < parts.Length && int.TryParse(parts[index], out int value) ? value : 0)
            .ToArray();
    }
}
