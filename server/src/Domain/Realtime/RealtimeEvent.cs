namespace Sentinel.Domain.Realtime;

public record RealtimeEvent(string Resource, Guid? Id = null, IReadOnlyList<Guid>? ProjectIds = null)
{
    public static IReadOnlyList<Guid> AffectedProjects(params Guid?[] projectIds) =>
        projectIds.OfType<Guid>().Distinct().ToList();
}
