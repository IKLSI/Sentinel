using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard.GetStats;

namespace Sentinel.Tests.Services.Dashboard;

public class DashboardStatsValidatorTests
{
    private readonly DashboardStatsValidator _validator = new();

    [Theory]
    [InlineData(DashboardPeriod.Week)]
    [InlineData(DashboardPeriod.Month)]
    [InlineData(DashboardPeriod.Quarter)]
    public async Task ValidateAsync_PeriodeConnue_EstAcceptee(DashboardPeriod period)
    {
        Result result = await _validator.ValidateAsync(new DashboardStatsRequest { Period = period },
            TestContext.Current.CancellationToken);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateAsync_PeriodeInconnue_EstRefusee()
    {
        Result result = await _validator.ValidateAsync(new DashboardStatsRequest { Period = (DashboardPeriod)12 },
            TestContext.Current.CancellationToken);

        result.IsSuccess.Should().BeFalse();
    }
}
