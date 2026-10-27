using System.Text.RegularExpressions;

namespace Sentinel.Application.Scanning.Parsers;

internal static partial class TomlManifest
{
    public sealed record LockPackage(string Name, string Version, string Block);

    public static IEnumerable<LockPackage> ReadLockPackages(string content)
    {
        foreach (Match block in PackageBlock().Matches(content))
        {
            string package = block.Groups[1].Value;
            Match nameMatch = PackageName().Match(package);
            Match versionMatch = PackageVersion().Match(package);
            if (!nameMatch.Success || !versionMatch.Success) continue;

            yield return new LockPackage(nameMatch.Groups[1].Value, versionMatch.Groups[1].Value, package);
        }
    }

    [GeneratedRegex(@"^[""']([^""']+)[""']$")]
    public static partial Regex QuotedLiteral();

    [GeneratedRegex(@"^[""']([^""']+)[""']")]
    public static partial Regex QuotedLiteralPrefix();

    [GeneratedRegex(@"version\s*=\s*[""']([^""']+)[""']")]
    public static partial Regex InlineTableVersion();

    [GeneratedRegex(@"\[\[package\]\](.*?)(?=\[\[package\]\]|\z)", RegexOptions.Singleline)]
    private static partial Regex PackageBlock();

    [GeneratedRegex(@"^\s*name\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline)]
    private static partial Regex PackageName();

    [GeneratedRegex(@"^\s*version\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline)]
    private static partial Regex PackageVersion();
}
