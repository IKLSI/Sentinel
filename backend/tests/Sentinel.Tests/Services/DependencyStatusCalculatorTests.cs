using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Tests.Services;

public class DependencyStatusCalculatorTests
{
    [Theory]
    [InlineData("1.2.3", "1.2.3", DependencyStatus.UpToDate)]
    [InlineData("1.2.3", null, DependencyStatus.UpToDate)]
    [InlineData("1.2.3", "", DependencyStatus.UpToDate)]
    [InlineData("", "1.2.3", DependencyStatus.UpToDate)]
    [InlineData("1.2.3", "1.3.0", DependencyStatus.MinorUpdate)]
    [InlineData("1.2.3", "2.0.0", DependencyStatus.MajorUpdate)]
    [InlineData("1.2.3", "1.2.4", DependencyStatus.MinorUpdate)]
    public void Compute_ClassifiesTheGapToLatest(string current, string? latest, DependencyStatus expected)
    {
        DependencyStatusCalculator.Compute(current, latest).Should().Be(expected);
    }

    [Theory]
    [InlineData("1.10.0", "1.9.0")]
    [InlineData("2.0.0", "1.9.0")]
    [InlineData("1.2.3", "1.2.3+build.9")]
    [InlineData("v1.2.3", "1.2.3")]
    public void Compute_AheadOfRegistry_IsNotReportedAsOutdated(string current, string latest)
    {
        DependencyStatusCalculator.Compute(current, latest).Should().Be(DependencyStatus.UpToDate);
    }

    [Fact]
    public void Compute_PrereleaseBehindStable_IsReportedAsOutdated()
    {
        DependencyStatusCalculator.Compute("2.0.0-rc.1", "2.0.0").Should().Be(DependencyStatus.MinorUpdate);
    }

    [Fact]
    public void Compute_MajorIsComparedWithoutVersionPrefix()
    {
        DependencyStatusCalculator.Compute("v1.2.3", "v2.0.0").Should().Be(DependencyStatus.MajorUpdate);
    }
}
