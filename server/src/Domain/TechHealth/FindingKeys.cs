using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public static class FindingKeys
{
    public static string ForVulnerability(DependencyEcosystem ecosystem, string packageName, string cveId) =>
        Normalize($"{ecosystem}:{packageName}:{cveId}");

    public static string ForDependency(DependencyEcosystem ecosystem, string name) =>
        Normalize($"{ecosystem}:{name}");

    public static string ForRuntime(string name) => Normalize(name);

    public static string AdvisoryOf(string vulnerabilityKey) =>
        vulnerabilityKey[(vulnerabilityKey.LastIndexOf(':') + 1)..];

    public static string PackageOf(string dependencyKey) => dependencyKey[(dependencyKey.IndexOf(':') + 1)..];

    private static string Normalize(string key) => key.Trim().ToLowerInvariant();
}
