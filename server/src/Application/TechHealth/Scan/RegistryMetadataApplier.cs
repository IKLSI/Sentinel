using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Scan;

public class RegistryMetadataApplier(IDependencyRegistryClient registry)
{
    public async Task ApplyAsync(IReadOnlyList<Dependency> dependencies, CancellationToken cancellationToken)
    {
        if (dependencies.Count == 0) return;

        List<RegistryPackageQuery> packages = dependencies
            .Select(dependency => new RegistryPackageQuery(dependency.Ecosystem, dependency.Name))
            .Distinct()
            .ToList();

        IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata> metadata =
            await registry.GetMetadataAsync(packages, cancellationToken);

        foreach (Dependency dependency in dependencies)
        {
            if (metadata.TryGetValue(new RegistryPackageQuery(dependency.Ecosystem, dependency.Name),
                    out RegistryPackageMetadata? package))
            {
                Apply(dependency, package);
            }
        }
    }

    private static void Apply(Dependency dependency, RegistryPackageMetadata package)
    {
        dependency.LatestVersion = package.LatestVersion;
        dependency.Publisher = package.Publisher ?? NamespacePublisher(dependency);
        dependency.License = package.License;
        dependency.IsDeprecated = package.IsDeprecated;
    }

    private static string? NamespacePublisher(Dependency dependency) => dependency.Ecosystem switch
    {
        DependencyEcosystem.Maven => SegmentBefore(dependency.Name, ':'),
        DependencyEcosystem.Composer => SegmentBefore(dependency.Name, '/'),
        DependencyEcosystem.Npm when dependency.Name.StartsWith('@') =>
            SegmentBefore(dependency.Name, '/')?.TrimStart('@'),
        DependencyEcosystem.Go => GoNamespace(dependency.Name),
        _ => null,
    };

    private static string? SegmentBefore(string value, char separator)
    {
        int index = value.IndexOf(separator);
        return index > 0 ? value[..index] : null;
    }

    private static string? GoNamespace(string module)
    {
        string[] segments = module.Split('/');
        return segments.Length >= 2 ? segments[1] : null;
    }
}
