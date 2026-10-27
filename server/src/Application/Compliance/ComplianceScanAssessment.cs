using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Compliance;

public enum ScanReliability
{
    Missing,
    InventoryIncomplete,
    VulnerabilityDataIncomplete,
    Stale,
    Reliable
}

public static class ComplianceScanAssessment
{
    private static readonly Dictionary<ScanFrequency, TimeSpan> FreshnessLimits = new()
    {
        [ScanFrequency.Daily] = TimeSpan.FromDays(3),
        [ScanFrequency.Weekly] = TimeSpan.FromDays(10),
        [ScanFrequency.Monthly] = TimeSpan.FromDays(35),
        [ScanFrequency.Manual] = TimeSpan.FromDays(30),
    };

    public static ScanReliability Of(Project project, DateTime now)
    {
        if (project.LastScanAt is not DateTime lastScanAt || project.Coverage != ScanCoverage.Covered)
            return ScanReliability.Missing;

        if (project.LastScanError == ErrorCodes.ScanInventoryIncomplete)
            return ScanReliability.InventoryIncomplete;

        if (project.LastScanError != null)
            return ScanReliability.VulnerabilityDataIncomplete;

        return now - lastScanAt > FreshnessLimits[project.ScanFrequency]
            ? ScanReliability.Stale
            : ScanReliability.Reliable;
    }

    public static int DaysSinceLastScan(Project project, DateTime now) =>
        project.LastScanAt is DateTime lastScanAt ? (int)(now - lastScanAt).TotalDays : 0;
}
