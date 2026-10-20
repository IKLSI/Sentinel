namespace Sentinel.Application.Dashboard.GetStats;

public sealed record RuntimeDeadline(
    string Runtime,
    string Version,
    DateOnly EolDate,
    int DaysLeft,
    IReadOnlyList<Guid> ProjectIds);
