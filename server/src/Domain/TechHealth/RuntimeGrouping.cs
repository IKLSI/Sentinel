using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public sealed record RuntimeGroup(Runtime MostAtRisk, IReadOnlyList<string> Versions);

public static class RuntimeGrouping
{
    public static IReadOnlyList<RuntimeGroup> ByName(IEnumerable<Runtime> runtimes) => runtimes
        .GroupBy(runtime => runtime.Name, StringComparer.OrdinalIgnoreCase)
        .Select(group => new RuntimeGroup(
            group.OrderBy(RiskRank).ThenBy(EndOfLifeDeadline).ThenBy(runtime => runtime.Version,
                VersionComparer.Instance).First(),
            group.Select(runtime => runtime.Version)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(version => version, VersionComparer.Instance)
                .ToList()))
        .OrderBy(group => group.MostAtRisk.Name, StringComparer.OrdinalIgnoreCase)
        .ToList();

    private static int RiskRank(Runtime runtime) => runtime switch
    {
        { IsEol: true } => 0,
        { EolDate: not null } => 1,
        { IsEol: false } => 2,
        _ => 3
    };

    private static DateTime EndOfLifeDeadline(Runtime runtime) => runtime.EolDate ?? DateTime.MaxValue;
}
