using System.Collections.Concurrent;

namespace Sentinel.Application.Auth.Login;

public sealed class LoginAttemptTracker
{
    public const int MaxFailures = 5;

    private const int PurgeThreshold = 10_000;
    private static readonly TimeSpan FailureWindow = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly ConcurrentDictionary<string, LoginAttempts> _attempts = new(StringComparer.OrdinalIgnoreCase);

    public bool IsLockedOut(string email) =>
        _attempts.TryGetValue(email, out LoginAttempts? attempts)
        && attempts.LockedUntil is DateTime lockedUntil
        && lockedUntil > DateTime.UtcNow;

    public bool RecordFailure(string email)
    {
        DateTime now = DateTime.UtcNow;

        if (_attempts.Count > PurgeThreshold) PurgeExpired(now);

        LoginAttempts attempts = _attempts.AddOrUpdate(
            email,
            _ => new LoginAttempts(1, now, null),
            (_, current) => Increment(current, now));

        return attempts.LockedUntil != null;
    }

    public void Reset(string email) => _attempts.TryRemove(email, out _);

    private static LoginAttempts Increment(LoginAttempts current, DateTime now)
    {
        if (current.LockedUntil is DateTime lockedUntil)
            return lockedUntil > now ? current : new LoginAttempts(1, now, null);

        if (now - current.WindowStart > FailureWindow)
            return new LoginAttempts(1, now, null);

        int failures = current.Failures + 1;

        return failures >= MaxFailures
            ? new LoginAttempts(failures, current.WindowStart, now.Add(LockoutDuration))
            : current with { Failures = failures };
    }

    private void PurgeExpired(DateTime now)
    {
        foreach ((string email, LoginAttempts attempts) in _attempts)
        {
            bool windowExpired = now - attempts.WindowStart > FailureWindow;
            bool lockExpired = attempts.LockedUntil is not DateTime lockedUntil || lockedUntil <= now;

            if (windowExpired && lockExpired) _attempts.TryRemove(email, out _);
        }
    }

    private sealed record LoginAttempts(int Failures, DateTime WindowStart, DateTime? LockedUntil);
}
