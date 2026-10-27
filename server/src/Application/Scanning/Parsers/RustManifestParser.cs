using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class RustManifestParser : IManifestFileParser
{
    private const string CargoToml = "Cargo.toml";
    private const string CargoLock = "Cargo.lock";

    private static readonly HashSet<string> FileNames = FileNameSet(CargoToml, CargoLock);

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(CargoToml)) ParseCargoToml(manifest, result);
        else ParseCargoLock(manifest, result);
    }

    private static void ParseCargoToml(ManifestDocument manifest, ManifestParseResult result)
    {
        Guid projectId = manifest.ProjectId;
        string content = manifest.Content;

        string? rustVersion = DetectRustVersion(content);
        if (rustVersion != null)
        {
            result.Runtimes.Add(NewRuntime(projectId, "Rust", rustVersion, isMinimumConstraint: true));
        }

        CargoSection section = default;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();

            if (line.StartsWith('['))
            {
                section = CargoSection.Of(line);
                continue;
            }

            if (section.SubTableName != null)
            {
                Match subTableVersion = SubTableVersionRegex().Match(line);
                if (!subTableVersion.Success) continue;

                result.Dependencies.Add(NewCargoDependency(projectId, section.SubTableName,
                    subTableVersion.Groups[1].Value, section.SubTableIsDev));
                section = section with { SubTableName = null };
                continue;
            }

            if (!section.ListsDependencies) continue;
            if (ReadInlineDependency(line) is not (string name, string requirement)) continue;

            result.Dependencies.Add(NewCargoDependency(projectId, name, requirement, section.ListsDev));
        }
    }

    private static void ParseCargoLock(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (TomlManifest.LockPackage package in TomlManifest.ReadLockPackages(manifest.Content))
        {
            if (!LockSourceRegex().IsMatch(package.Block)) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, package.Name, package.Version,
                DependencyEcosystem.Cargo));
        }
    }

    private static (string Name, string Requirement)? ReadInlineDependency(string line)
    {
        if (line.StartsWith('#') || string.IsNullOrEmpty(line)) return null;

        int equals = line.IndexOf('=');
        if (equals < 0) return null;

        string name = line[..equals].Trim();
        string value = line[(equals + 1)..].Trim();

        Match literal = TomlManifest.QuotedLiteral().Match(value);
        if (literal.Success) return (name, literal.Groups[1].Value);

        Match inlineTable = TomlManifest.InlineTableVersion().Match(value);

        return inlineTable.Success ? (name, inlineTable.Groups[1].Value) : null;
    }

    private static Dependency NewCargoDependency(Guid projectId, string name, string requirement, bool isDev) => new()
    {
        ProjectId = projectId,
        Name = name,
        CurrentVersion = VersionText.Clean(requirement),
        IsVersionPinned = IsExactRequirement(requirement),
        Type = isDev ? DependencyType.Dev : DependencyType.Prod,
        Ecosystem = DependencyEcosystem.Cargo,
    };

    private static bool IsExactRequirement(string requirement) =>
        requirement.TrimStart().StartsWith('=') && VersionText.IsExact(requirement.Trim());

    private static string? DetectRustVersion(string content)
    {
        Match minimumSupported = RustVersionRegex().Match(content);

        return minimumSupported.Success ? minimumSupported.Groups[1].Value : null;
    }

    [GeneratedRegex(@"^\[(?:target\.[^\]]+\.)?(?:workspace\.)?(?<kind>dependencies|dev-dependencies|build-dependencies)\.(?<name>[^\]]+)\]$")]
    private static partial Regex DependencySubTableRegex();

    [GeneratedRegex(@"^version\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex SubTableVersionRegex();

    [GeneratedRegex(@"rust-version\s*=\s*[""']([\d.]+)[""']")]
    private static partial Regex RustVersionRegex();

    [GeneratedRegex(@"^\s*source\s*=", RegexOptions.Multiline)]
    private static partial Regex LockSourceRegex();

    private readonly record struct CargoSection(bool ListsProd, bool ListsDev, string? SubTableName, bool SubTableIsDev)
    {
        public bool ListsDependencies => ListsProd || ListsDev;

        public static CargoSection Of(string header)
        {
            Match subTable = DependencySubTableRegex().Match(header);
            bool isTargetSection = header.StartsWith("[target.", StringComparison.Ordinal);

            return new CargoSection(
                ListsProd: header is "[dependencies]" or "[workspace.dependencies]"
                    || (isTargetSection && header.EndsWith(".dependencies]", StringComparison.Ordinal)),
                ListsDev: header is "[dev-dependencies]" or "[build-dependencies]"
                    || (isTargetSection && header.EndsWith("-dependencies]", StringComparison.Ordinal)),
                SubTableName: subTable.Success ? subTable.Groups["name"].Value.Trim('"') : null,
                SubTableIsDev: subTable.Success && subTable.Groups["kind"].Value != "dependencies");
        }
    }
}
