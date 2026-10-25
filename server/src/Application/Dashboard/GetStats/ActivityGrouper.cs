namespace Sentinel.Application.Dashboard.GetStats;

public static class ActivityGrouper
{
    private static readonly string[] GroupableTypes = ["created", "resolved"];

    public static List<ActivityItemDto> Group(IReadOnlyList<ActivityItemDto> orderedItems)
    {
        List<ActivityItemDto> grouped = [];
        int index = 0;

        while (index < orderedItems.Count)
        {
            ActivityItemDto first = orderedItems[index];
            int end = index + 1;

            while (end < orderedItems.Count && BelongsToSameGroup(first, orderedItems[end])) end++;

            grouped.Add(end - index > 1 ? Merge(first, end - index) : first);
            index = end;
        }

        return grouped;
    }

    private static bool BelongsToSameGroup(ActivityItemDto first, ActivityItemDto candidate) =>
        first.ProjectId is not null
        && first.Type is string type
        && GroupableTypes.Contains(type)
        && candidate.Type == type
        && candidate.ProjectId == first.ProjectId;

    private static ActivityItemDto Merge(ActivityItemDto latest, int count) => new()
    {
        Color = latest.Color,
        Timestamp = latest.Timestamp,
        Detail = latest.ProjectName,
        ProjectId = latest.ProjectId,
        ProjectName = latest.ProjectName,
        Count = count,
        Type = latest.Type,
    };
}
