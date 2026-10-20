using FluentAssertions;
using Sentinel.Application.Auth.Login;

namespace Sentinel.Tests.Services;

public class LoginAttemptTrackerTests
{
    [Fact]
    public void RecordFailure_BelowThreshold_DoesNotLock()
    {
        LoginAttemptTracker tracker = new LoginAttemptTracker();

        for (int attempt = 1; attempt < LoginAttemptTracker.MaxFailures; attempt++)
            tracker.RecordFailure("dev@sentinel.io").Should().BeFalse();

        tracker.IsLockedOut("dev@sentinel.io").Should().BeFalse();
    }

    [Fact]
    public void RecordFailure_AtThreshold_LocksTheAccountCaseInsensitively()
    {
        LoginAttemptTracker tracker = new LoginAttemptTracker();

        for (int attempt = 1; attempt < LoginAttemptTracker.MaxFailures; attempt++)
            tracker.RecordFailure("dev@sentinel.io");

        tracker.RecordFailure("DEV@sentinel.io").Should().BeTrue();
        tracker.IsLockedOut("dev@sentinel.io").Should().BeTrue();
        tracker.IsLockedOut("other@sentinel.io").Should().BeFalse();
    }

    [Fact]
    public void Reset_ClearsPreviousFailures()
    {
        LoginAttemptTracker tracker = new LoginAttemptTracker();

        for (int attempt = 1; attempt < LoginAttemptTracker.MaxFailures; attempt++)
            tracker.RecordFailure("dev@sentinel.io");

        tracker.Reset("dev@sentinel.io");

        tracker.RecordFailure("dev@sentinel.io").Should().BeFalse();
    }
}
