using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public static partial class RemediationRules
{
    public const string BranchPrefix = "sentinel/";
    private const string BranchTopicPrefix = "fix-";
    private const int MaxBranchSegmentLength = 80;
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

    public static string BranchTopicFor(string packageName, string targetVersion) =>
        $"{BranchTopicPrefix}{Slug(packageName)}-{Slug(targetVersion)}";

    public static string BranchNameFor(string packageName, string targetVersion) =>
        $"{BranchPrefix}{BranchTopicFor(packageName, targetVersion)}";

    private static string Slug(string value)
    {
        string slug = UnsafeBranchCharacters().Replace(value.Trim().ToLowerInvariant(), "-").Trim('-', '.');

        return slug.Length > MaxBranchSegmentLength ? slug[..MaxBranchSegmentLength].TrimEnd('-', '.') : slug;
    }

    [GeneratedRegex(@"[^a-z0-9.]+|\.{2,}")]
    private static partial Regex UnsafeBranchCharacters();
}
