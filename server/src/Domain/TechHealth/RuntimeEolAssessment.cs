using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public enum RuntimeEolStatus
{
    Unknown,
    Ok,
    Warn,
    Danger,
    Eol
}

public sealed record RuntimeEolAssessment(RuntimeEolStatus Status, int? DaysRemaining, int ProgressPercent)
{
    private const int DangerThresholdDays = 90;
    private const int WarnThresholdDays = 180;
    private const int ProgressWindowDays = 365;
    private const int MinProgressPercent = 4;
    private const int MaxProgressPercent = 100;

    public static RuntimeEolAssessment Of(Runtime runtime, DateTime now)
    {
        int? daysRemaining = runtime.EolDate is DateTime eolDate
            ? (int)Math.Round((eolDate - now).TotalDays, MidpointRounding.AwayFromZero)
            : null;

        RuntimeEolStatus status = StatusOf(runtime.IsEol, daysRemaining);

        return new RuntimeEolAssessment(status, daysRemaining, ProgressOf(status, daysRemaining));
    }

    private static RuntimeEolStatus StatusOf(bool? isEol, int? daysRemaining) => daysRemaining switch
    {
        null => isEol switch
        {
            null => RuntimeEolStatus.Unknown,
            true => RuntimeEolStatus.Eol,
            false => RuntimeEolStatus.Ok
        },
        < 0 => RuntimeEolStatus.Eol,
        < DangerThresholdDays => RuntimeEolStatus.Danger,
        < WarnThresholdDays => RuntimeEolStatus.Warn,
        _ => RuntimeEolStatus.Ok
    };

    private static int ProgressOf(RuntimeEolStatus status, int? daysRemaining)
    {
        if (status == RuntimeEolStatus.Unknown) return 0;
        if (status == RuntimeEolStatus.Eol) return MaxProgressPercent;
        if (daysRemaining is not int days) return MinProgressPercent;

        double consumed = (double)(ProgressWindowDays - days) / ProgressWindowDays * MaxProgressPercent;

        return Math.Clamp((int)Math.Round(consumed, MidpointRounding.AwayFromZero), MinProgressPercent,
            MaxProgressPercent);
    }
}
