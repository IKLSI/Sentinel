using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public static partial class PackageNameNormalizer
{
    public static string ForVulnerabilityFeed(DependencyEcosystem ecosystem, string packageName) =>
        ecosystem == DependencyEcosystem.PyPI
            ? PyPiSeparatorRegex().Replace(packageName.Trim(), "-").ToLowerInvariant()
            : packageName;

    public static string ForVulnerabilityFeed(string? ecosystemName, string packageName) =>
        string.Equals(ecosystemName, "PyPI", StringComparison.OrdinalIgnoreCase)
            ? ForVulnerabilityFeed(DependencyEcosystem.PyPI, packageName)
            : packageName;

    [GeneratedRegex(@"[-_.]+")]
    private static partial Regex PyPiSeparatorRegex();
}
