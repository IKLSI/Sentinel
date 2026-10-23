using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public static class InventoryCarryOver
{
    public static void ApplyPackageMetadata(IEnumerable<Dependency> dependencies,
        IReadOnlyList<PackageMetadataRow> previous)
    {
        Dictionary<(DependencyEcosystem, string), PackageMetadataRow> known = previous
            .Where(row => row.LatestVersion != null)
            .GroupBy(row => (row.Ecosystem, DependencyIdentity.NameKey(row.Ecosystem, row.Name)))
            .ToDictionary(group => group.Key, group => group.First());

        foreach (Dependency dependency in dependencies.Where(dependency => dependency.LatestVersion == null))
        {
            if (!known.TryGetValue(DependencyIdentity.Of(dependency), out PackageMetadataRow? row))
            {
                continue;
            }

            dependency.LatestVersion = row.LatestVersion;
            dependency.Publisher ??= row.Publisher;
            dependency.License ??= row.License;
            dependency.IsDeprecated = row.IsDeprecated;

            if (dependency.Status != DependencyStatus.Vulnerable)
                dependency.Status = DependencyStatusCalculator.For(dependency);
        }
    }

    public static void ApplyRuntimeLifecycle(IEnumerable<Runtime> runtimes, IReadOnlyList<RuntimeLifecycleRow> previous)
    {
        Dictionary<(string, string), RuntimeLifecycleRow> known = previous
            .Where(row => row.IsEol != null || row.EolDate != null)
            .GroupBy(row => (row.Name.ToLowerInvariant(), row.Version.Trim()))
            .ToDictionary(group => group.Key, group => group.First());

        foreach (Runtime runtime in runtimes.Where(runtime => runtime.IsEol == null && runtime.EolDate == null))
        {
            if (!known.TryGetValue((runtime.Name.ToLowerInvariant(), runtime.Version.Trim()),
                    out RuntimeLifecycleRow? row))
            {
                continue;
            }

            runtime.IsEol = row.IsEol;
            runtime.EolDate = row.EolDate;
        }
    }
}
