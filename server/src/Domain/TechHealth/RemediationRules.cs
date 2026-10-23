using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public static class RemediationRules
{
    public const string BranchPrefix = "sentinel/";
    public const string GroupName = "vulnerabilities flagged by Sentinel";
    public const string GroupSlug = "fix-vulnerabilities";
    public const string BranchName = BranchPrefix + GroupSlug;
    private static readonly TimeSpan StaleMargin = TimeSpan.FromMinutes(15);

    public static readonly TimeSpan MaxRunDuration = TimeSpan.FromMinutes(45);

    public static bool IsStale(VulnerabilityRemediation remediation, DateTime now) =>
        remediation.IsInProgress && now - remediation.UpdatedAt > MaxRunDuration + StaleMargin;

    public static bool IsEligible(Dependency dependency, Vulnerability vulnerability) =>
        dependency.IsDirect
        && !string.IsNullOrWhiteSpace(vulnerability.FixedVersion)
        && VersionComparer.Instance.Compare(dependency.CurrentVersion, vulnerability.FixedVersion) < 0;

    public static bool IsMajorUpgrade(Dependency dependency, Vulnerability vulnerability) =>
        !string.IsNullOrWhiteSpace(vulnerability.FixedVersion)
        && DependencyStatusCalculator.Compute(dependency.CurrentVersion, vulnerability.FixedVersion)
        == DependencyStatus.MajorUpdate;

    public static IReadOnlyList<(Dependency Dependency, Vulnerability Vulnerability)> RemediableFindings(
        IEnumerable<Dependency> dependencies, IReadOnlySet<string> suppressedFindingKeys) =>
        dependencies
            .SelectMany(dependency => dependency.Vulnerabilities
                .Select(vulnerability => (Dependency: dependency, Vulnerability: vulnerability)))
            .Where(finding => IsEligible(finding.Dependency, finding.Vulnerability)
                && !suppressedFindingKeys.Contains(FindingKeys.ForVulnerability(finding.Dependency.Ecosystem,
                    finding.Vulnerability.PackageName, finding.Vulnerability.CveId)))
            .ToList();

    public static IReadOnlyList<RemediationTarget> TargetsFor(
        IEnumerable<(Dependency Dependency, Vulnerability Vulnerability)> findings) =>
        findings
            .GroupBy(finding => (finding.Dependency.Ecosystem, finding.Dependency.Name))
            .Select(group => TargetOf(group.Key.Ecosystem, group.Key.Name, group.ToList()))
            .OrderBy(target => target.PackageName, StringComparer.Ordinal)
            .ToList();

    private static RemediationTarget TargetOf(DependencyEcosystem ecosystem, string packageName,
        IReadOnlyList<(Dependency Dependency, Vulnerability Vulnerability)> findings)
    {
        string targetVersion = findings
            .Select(finding => finding.Vulnerability.FixedVersion!)
            .Max(VersionComparer.Instance)!;

        return new RemediationTarget(
            ecosystem,
            packageName,
            targetVersion,
            findings
                .Select(finding => finding.Dependency.CurrentVersion)
                .Distinct()
                .Order(VersionComparer.Instance)
                .ToList(),
            findings
                .Select(finding => new RemediationAdvisory(finding.Vulnerability.CveId, finding.Vulnerability.Severity))
                .DistinctBy(advisory => advisory.CveId)
                .OrderBy(advisory => advisory.Severity)
                .ThenBy(advisory => advisory.CveId, StringComparer.Ordinal)
                .ToList(),
            findings
                .Select(finding => finding.Dependency.ManifestPath)
                .Distinct()
                .ToList(),
            findings.Any(finding => DependencyStatusCalculator.Compute(finding.Dependency.CurrentVersion,
                targetVersion) == DependencyStatus.MajorUpdate));
    }
}
