using FluentAssertions;
using Sentinel.Domain.Models;

namespace Sentinel.Tests.Services;

public class PlanLimitsTests
{
    [Theory]
    [InlineData(PlanTier.Free, ScanFrequency.Daily, false)]
    [InlineData(PlanTier.Free, ScanFrequency.Weekly, false)]
    [InlineData(PlanTier.Free, ScanFrequency.Monthly, true)]
    [InlineData(PlanTier.Free, ScanFrequency.Manual, true)]
    [InlineData(PlanTier.Pro, ScanFrequency.Daily, false)]
    [InlineData(PlanTier.Pro, ScanFrequency.Weekly, true)]
    [InlineData(PlanTier.Business, ScanFrequency.Daily, true)]
    public void AllowsFrequency_SelonLePlan_AutoriseOuRefuse(PlanTier tier, ScanFrequency frequency, bool expected)
    {
        PlanLimits.For(tier).AllowsFrequency(frequency).Should().Be(expected);
    }

    [Fact]
    public void FrequenciesAbovePlan_PourLePlanGratuit_ListeLesFrequencesTropRapprochees()
    {
        PlanLimits.For(PlanTier.Free).FrequenciesAbovePlan()
            .Should().BeEquivalentTo([ScanFrequency.Daily, ScanFrequency.Weekly]);
    }

    [Fact]
    public void FrequenciesAbovePlan_PourLePlanBusiness_NeListeRien()
    {
        PlanLimits.For(PlanTier.Business).FrequenciesAbovePlan().Should().BeEmpty();
    }

    [Theory]
    [InlineData(PlanTier.Free)]
    [InlineData(PlanTier.Pro)]
    public void MaxScanFrequency_CouvreTousLesProjetsDuPlan_SansEpuiserLeQuotaMensuel(PlanTier tier)
    {
        PlanLimits limits = PlanLimits.For(tier);

        int scansParMoisAuPire = limits.MaxProjects * ScansPerMonth(limits.MaxScanFrequency);

        scansParMoisAuPire.Should().BeLessThanOrEqualTo(limits.MaxScansPerMonth);
    }

    private static int ScansPerMonth(ScanFrequency frequency) => frequency switch
    {
        ScanFrequency.Daily => 31,
        ScanFrequency.Weekly => 5,
        ScanFrequency.Monthly => 1,
        _ => 0
    };
}
