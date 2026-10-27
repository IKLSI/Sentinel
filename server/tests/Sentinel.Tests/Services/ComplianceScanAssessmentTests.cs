using FluentAssertions;
using Sentinel.Application.Compliance;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class ComplianceScanAssessmentTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Of_NeverScannedProject_IsMissing()
    {
        Project project = new Project { Coverage = ScanCoverage.NotScanned };

        ComplianceScanAssessment.Of(project, Now).Should().Be(ScanReliability.Missing);
    }

    [Fact]
    public void Of_IncompleteInventory_IsReported()
    {
        Project project = Scanned(Now.AddHours(-2));
        project.LastScanError = ErrorCodes.ScanInventoryIncomplete;

        ComplianceScanAssessment.Of(project, Now).Should().Be(ScanReliability.InventoryIncomplete);
    }

    [Fact]
    public void Of_WeeklyProjectScannedTwoWeeksAgo_IsStale()
    {
        ComplianceScanAssessment.Of(Scanned(Now.AddDays(-14)), Now).Should().Be(ScanReliability.Stale);
    }

    [Fact]
    public void Of_RecentCompleteScan_IsReliable()
    {
        ComplianceScanAssessment.Of(Scanned(Now.AddDays(-2)), Now).Should().Be(ScanReliability.Reliable);
    }

    private static Project Scanned(DateTime lastScanAt) => new()
    {
        Coverage = ScanCoverage.Covered,
        ScanFrequency = ScanFrequency.Weekly,
        LastScanAt = lastScanAt
    };
}
