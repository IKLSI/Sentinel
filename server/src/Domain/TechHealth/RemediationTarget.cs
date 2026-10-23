using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public sealed record RemediationAdvisory(string CveId, VulnerabilitySeverity Severity);

public sealed record RemediationTarget(
    DependencyEcosystem Ecosystem,
    string PackageName,
    string TargetVersion,
    IReadOnlyList<string> CurrentVersions,
    IReadOnlyList<RemediationAdvisory> Advisories,
    IReadOnlyList<string?> ManifestPaths,
    bool IsMajorUpgrade);
