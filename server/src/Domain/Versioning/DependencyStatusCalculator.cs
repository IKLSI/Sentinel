using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Versioning;

public static class DependencyStatusCalculator
{
    public static DependencyStatus Compute(string current, string? latest)
    {
        if (string.IsNullOrEmpty(latest) || string.IsNullOrEmpty(current)) return DependencyStatus.UpToDate;
        if (VersionComparer.Instance.Compare(current, latest) >= 0) return DependencyStatus.UpToDate;

        return MajorOf(latest) > MajorOf(current) ? DependencyStatus.MajorUpdate : DependencyStatus.MinorUpdate;
    }

    private static int MajorOf(string version)
    {
        string[] parts = version.TrimStart('v', 'V').Split('.');

        return parts.Length > 0 && int.TryParse(parts[0], out int major) ? major : 0;
    }
}
