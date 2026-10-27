namespace Sentinel.Application.RuntimeLifecycles;

public class RuntimeLifecyclesDto
{
    public DateTime AsOf { get; set; }
    public int WarningWindowDays { get; set; }
    public List<RuntimeLifecycleItemDto> Items { get; set; } = [];
    public List<string> UpcomingNames { get; set; } = [];
    public int? UpcomingDays { get; set; }
}

public class RuntimeLifecycleItemDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime? ReleaseDate { get; set; }
    public DateTime? EndOfLifeDate { get; set; }
    public string Status { get; set; } = RuntimeLifecycleStatuses.Unknown;
    public int? DaysRemaining { get; set; }
}
