using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public static class DependencyIdentity
{
    public static string NameKey(DependencyEcosystem ecosystem, string name) =>
        PackageNameNormalizer.ForVulnerabilityFeed(ecosystem, name).Trim().ToLowerInvariant();

    public static (DependencyEcosystem Ecosystem, string Name) Of(Dependency dependency) =>
        (dependency.Ecosystem, NameKey(dependency.Ecosystem, dependency.Name));
}
