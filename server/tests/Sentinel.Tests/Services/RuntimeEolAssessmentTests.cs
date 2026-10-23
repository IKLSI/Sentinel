using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class RuntimeEolAssessmentTests
{
    private static readonly DateTime Now = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static RuntimeEolAssessment Assess(bool? isEol = null, int? eolInDays = null) =>
        RuntimeEolAssessment.Of(new Runtime
        {
            Name = "Node.js",
            Version = "20",
            IsEol = isEol,
            EolDate = eolInDays is int days ? Now.AddDays(days) : null
        }, Now);

    [Theory]
    [InlineData(null, RuntimeEolStatus.Unknown)]
    [InlineData(false, RuntimeEolStatus.Ok)]
    [InlineData(true, RuntimeEolStatus.Eol)]
    public void Of_WithoutEolDate_FollowsTheLifecycleFlag(bool? isEol, RuntimeEolStatus expected)
    {
        RuntimeEolAssessment assessment = Assess(isEol: isEol);

        assessment.Status.Should().Be(expected);
        assessment.DaysRemaining.Should().BeNull();
    }

    [Theory]
    [InlineData(-10, RuntimeEolStatus.Eol)]
    [InlineData(30, RuntimeEolStatus.Danger)]
    [InlineData(120, RuntimeEolStatus.Warn)]
    [InlineData(400, RuntimeEolStatus.Ok)]
    public void Of_WithEolDate_GradesTheUrgencyByRemainingDays(int eolInDays, RuntimeEolStatus expected)
    {
        RuntimeEolAssessment assessment = Assess(eolInDays: eolInDays);

        assessment.Status.Should().Be(expected);
        assessment.DaysRemaining.Should().Be(eolInDays);
    }

    [Fact]
    public void Of_ProgressReflectsTheConsumedSupportWindow()
    {
        Assess().ProgressPercent.Should().Be(0);
        Assess(isEol: true).ProgressPercent.Should().Be(100);
        Assess(eolInDays: 400).ProgressPercent.Should().Be(4);
        Assess(eolInDays: 73).ProgressPercent.Should().Be(80);
    }

    [Fact]
    public void Of_OnTheEolDayDuringTheDay_StaysInDangerAndAgreesWithTheLifecycle()
    {
        DateTime eolDay = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime duringTheDay = eolDay.AddHours(10);

        RuntimeEolAssessment assessment = RuntimeEolAssessment.Of(new Runtime
        {
            Name = "Node.js",
            Version = "20",
            EolDate = eolDay
        }, duringTheDay);

        assessment.Status.Should().Be(RuntimeEolStatus.Danger);
        assessment.DaysRemaining.Should().Be(0);
        new RuntimeLifecycle(null, eolDay).IsEolAt(duringTheDay).Should().BeFalse();
        new RuntimeLifecycle(null, eolDay).IsEolAt(eolDay.AddDays(1)).Should().BeTrue();
    }
}
