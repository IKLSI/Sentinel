using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Versioning;

public static class DependencyStatusCalculator
{
    public static DependencyStatus Compute(string current, string? latest)
    {
        if (string.IsNullOrEmpty(latest) || current == latest) return DependencyStatus.UpToDate;

        int currentMajor = MajorOf(current);
        int latestMajor = MajorOf(latest);

        return latestMajor > currentMajor ? DependencyStatus.MajorUpdate : DependencyStatus.MinorUpdate;
    }

    private static int MajorOf(string version)
    {
        string[] parts = version.Split('.');

        return parts.Length > 0 && int.TryParse(parts[0], out int major) ? major : 0;
    }
}
