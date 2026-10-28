using Sentinel.Domain.Entities;

namespace Sentinel.Application.Deployments.Compare;

public sealed record ReleaseRuntimeChange(string Name, string? BaseVersion, string? HeadVersion);

public static class ReleaseRuntimes
{
    public static List<ReleaseRuntimeChange> Compare(List<Runtime> before, List<Runtime> after)
    {
        Dictionary<string, Runtime> previous = IndexRuntimes(before);
        Dictionary<string, Runtime> current = IndexRuntimes(after);

        return previous.Keys.Union(current.Keys, StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .Select(name => (Before: previous.GetValueOrDefault(name), After: current.GetValueOrDefault(name)))
            .Where(pair => pair.Before?.Version != pair.After?.Version)
            .Select(pair => new ReleaseRuntimeChange(
                (pair.After ?? pair.Before)!.Name,
                pair.Before?.Version,
                pair.After?.Version))
            .ToList();
    }

    private static Dictionary<string, Runtime> IndexRuntimes(List<Runtime> runtimes) =>
        runtimes
            .GroupBy(runtime => runtime.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);
}
