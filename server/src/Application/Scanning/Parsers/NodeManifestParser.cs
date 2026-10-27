using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class NodeManifestParser : IManifestFileParser
{
    private const string PackageJson = "package.json";
    private const string PackageLockJson = "package-lock.json";
    private const string PnpmLock = "pnpm-lock.yaml";
    private const string NodeModulesSegment = "node_modules/";
    private const int DefaultPnpmLockfileMajor = 9;
    private const int LastSlashSeparatedPnpmLockfileMajor = 5;

    private static readonly HashSet<string> FileNames = FileNameSet(PackageJson, PackageLockJson, PnpmLock);

    private static readonly string[] RootDependencySections =
        ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

    private static readonly Dictionary<string, string> FrameworkRuntimes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["react"] = "React",
        ["next"] = "Next.js",
        ["vue"] = "Vue",
        ["@angular/core"] = "Angular",
        ["svelte"] = "Svelte",
        ["@nestjs/core"] = "NestJS",
        ["express"] = "Express",
        ["fastify"] = "Fastify",
        ["@remix-run/react"] = "Remix",
        ["nuxt"] = "Nuxt",
        ["gatsby"] = "Gatsby",
        ["astro"] = "Astro",
        ["react-native"] = "React Native",
    };

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(PackageJson)) ParsePackageJson(manifest, result);
        else if (manifest.Is(PackageLockJson)) ParsePackageLock(manifest, result);
        else ParsePnpmLock(manifest, result);
    }

    private static void ParsePackageJson(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);
        JsonElement root = doc.RootElement;

        AddNodeEngineRuntime(manifest.ProjectId, root, result.Runtimes);

        foreach ((string name, string version, bool isMinimumConstraint) in DetectFrameworkRuntimes(root))
            result.Runtimes.Add(NewRuntime(manifest.ProjectId, name, version, isMinimumConstraint));

        if (root.TryGetProperty("dependencies", out JsonElement prodDeps))
            AddPackageJsonDependencies(manifest.ProjectId, prodDeps, DependencyType.Prod, result.Dependencies);

        if (root.TryGetProperty("devDependencies", out JsonElement devDeps))
            AddPackageJsonDependencies(manifest.ProjectId, devDeps, DependencyType.Dev, result.Dependencies);
    }

    private static void AddNodeEngineRuntime(Guid projectId, JsonElement root, List<Runtime> runtimes)
    {
        if (!root.TryGetProperty("engines", out JsonElement engines)) return;
        if (!engines.TryGetProperty("node", out JsonElement nodeProperty)) return;

        string specification = nodeProperty.GetString() ?? "";
        string version = VersionText.Clean(specification);
        if (!VersionText.StartsWithDigit(version)) return;

        runtimes.Add(ConstrainedRuntime(projectId, "Node.js", version, specification));
    }

    private static List<(string Name, string Version, bool IsMinimumConstraint)> DetectFrameworkRuntimes(JsonElement root)
    {
        List<(string Name, string Version, bool IsMinimumConstraint)> detected = new List<(string, string, bool)>();

        foreach (string section in new[] { "dependencies", "devDependencies" })
        {
            if (!root.TryGetProperty(section, out JsonElement dependencies)) continue;

            foreach ((string? package, string? name) in FrameworkRuntimes)
            {
                if (detected.Any(runtime => runtime.Name == name)) continue;
                if (!dependencies.TryGetProperty(package, out JsonElement versionProperty)) continue;

                string specification = versionProperty.GetString() ?? "";

                if (TryReadNpmSpecification(specification, out string version, out bool _))
                    detected.Add((name, version, !VersionText.IsExact(specification)));
            }
        }

        return detected;
    }

    private static void AddPackageJsonDependencies(Guid projectId, JsonElement element, DependencyType type,
        List<Dependency> deps)
    {
        foreach (JsonProperty prop in element.EnumerateObject())
        {
            string specification = prop.Value.GetString() ?? "";
            if (!TryReadNpmSpecification(specification, out string version, out bool pinned)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = NpmAliasTarget(specification) ?? prop.Name,
                CurrentVersion = version,
                IsVersionPinned = pinned,
                Type = type,
                Ecosystem = DependencyEcosystem.Npm,
            });
        }
    }

    private static string? NpmAliasTarget(string specification)
    {
        string spec = specification.Trim();
        if (!spec.StartsWith("npm:", StringComparison.OrdinalIgnoreCase)) return null;

        int at = spec.LastIndexOf('@');
        string target = at > 4 ? spec[4..at] : spec[4..];

        return string.IsNullOrWhiteSpace(target) ? null : target;
    }

    private static bool TryReadNpmSpecification(string specification, out string version, out bool pinned)
    {
        string spec = specification.Trim();

        if (spec.StartsWith("npm:", StringComparison.OrdinalIgnoreCase))
        {
            int at = spec.LastIndexOf('@');
            spec = at > 4 ? spec[(at + 1)..] : string.Empty;
        }

        version = VersionText.Clean(spec);
        pinned = VersionText.IsExact(spec);

        return !spec.Contains(':') && !spec.Contains('/') && VersionText.StartsWithDigit(version);
    }

    private static void ParsePackageLock(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);
        JsonElement root = doc.RootElement;

        int lockfileVersion = root.TryGetProperty("lockfileVersion", out JsonElement versionProperty) ? versionProperty.GetInt32() : 1;

        if (lockfileVersion >= 2 && root.TryGetProperty("packages", out JsonElement packages))
            AddPackageLockV2Dependencies(manifest.ProjectId, packages, result.Dependencies);
        else if (root.TryGetProperty("dependencies", out JsonElement dependencies))
            AddPackageLockV1Dependencies(manifest.ProjectId, dependencies, result.Dependencies);
    }

    private static void AddPackageLockV2Dependencies(Guid projectId, JsonElement packages, List<Dependency> deps)
    {
        HashSet<string> rootDependencyNames = RootDependencyNames(packages);

        foreach (JsonProperty package in packages.EnumerateObject())
        {
            int segment = package.Name.LastIndexOf(NodeModulesSegment, StringComparison.Ordinal);
            if (segment < 0) continue;

            string installedName = package.Name[(segment + NodeModulesSegment.Length)..];
            if (string.IsNullOrEmpty(installedName)) continue;

            string version = ReadLockedVersion(package.Value);
            if (string.IsNullOrEmpty(version)) continue;

            string name = package.Value.StringProperty("name") is { Length: > 0 } aliasTarget ? aliasTarget : installedName;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = IsDevOnly(package.Value) ? DependencyType.Dev : DependencyType.Prod,
                IsDirect = segment == 0 && rootDependencyNames.Contains(installedName),
                Ecosystem = DependencyEcosystem.Npm,
            });
        }
    }

    private static void AddPackageLockV1Dependencies(Guid projectId, JsonElement dependencies, List<Dependency> deps)
    {
        foreach (JsonProperty package in dependencies.EnumerateObject())
        {
            string version = ReadLockedVersion(package.Value);
            if (string.IsNullOrEmpty(version)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = package.Name,
                CurrentVersion = version,
                Type = IsDevOnly(package.Value) ? DependencyType.Dev : DependencyType.Prod,
                IsDirect = false,
                Ecosystem = DependencyEcosystem.Npm,
            });

            if (package.Value.TryGetProperty("dependencies", out JsonElement nested))
                AddPackageLockV1Dependencies(projectId, nested, deps);
        }
    }

    private static string ReadLockedVersion(JsonElement package) =>
        package.StringProperty("version") ?? "";

    private static bool IsDevOnly(JsonElement package) =>
        IsFlagSet(package, "dev") || IsFlagSet(package, "devOptional");

    private static bool IsFlagSet(JsonElement package, string flag) =>
        package.TryGetProperty(flag, out JsonElement value) && value.ValueKind == JsonValueKind.True;

    private static HashSet<string> RootDependencyNames(JsonElement packages)
    {
        HashSet<string> names = new(StringComparer.Ordinal);
        if (!packages.TryGetProperty("", out JsonElement rootPackage)) return names;

        foreach (string section in RootDependencySections)
        {
            if (!rootPackage.TryGetProperty(section, out JsonElement dependencies)
                || dependencies.ValueKind != JsonValueKind.Object) continue;

            foreach (JsonProperty dependency in dependencies.EnumerateObject()) names.Add(dependency.Name);
        }

        return names;
    }

    private static void ParsePnpmLock(ManifestDocument manifest, ManifestParseResult result)
    {
        string content = manifest.Content;
        Match versionMatch = PnpmLockfileVersionRegex().Match(content);
        int major = versionMatch.Success ? int.Parse(versionMatch.Groups[1].Value) : DefaultPnpmLockfileMajor;

        bool inPackages = false;
        Dependency? current = null;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (string.IsNullOrEmpty(line)) continue;

            if (!line.StartsWith(' '))
            {
                inPackages = line.StartsWith("packages:", StringComparison.Ordinal);
                current = null;
                continue;
            }

            if (!inPackages) continue;

            if (current != null && line.Trim() == "dev: true")
            {
                current.Type = DependencyType.Dev;
                continue;
            }

            if (!PnpmTopLevelKeyRegex().IsMatch(line) || !line.EndsWith(':')) continue;

            string key = line.Trim().TrimEnd(':').Trim().Trim('\'', '"');
            if (ParsePnpmPackageKey(key, major) is not (string name, string version))
            {
                current = null;
                continue;
            }

            current = NewDependency(manifest.ProjectId, name, version, DependencyEcosystem.Npm);
            result.Dependencies.Add(current);
        }
    }

    private static (string Name, string Version)? ParsePnpmPackageKey(string key, int major)
    {
        if (string.IsNullOrEmpty(key)) return null;
        if (key.StartsWith('/')) key = key[1..];

        int paren = key.IndexOf('(');
        if (paren >= 0) key = key[..paren];

        (string Name, string Version)? identity = major <= LastSlashSeparatedPnpmLockfileMajor
            ? SplitSlashSeparatedKey(key)
            : SplitAtSeparatedKey(key);

        if (identity is not (string name, string version)) return null;
        if (name.Length == 0 || version.Length == 0 || !char.IsDigit(version[0])) return null;

        return (name, version);
    }

    private static (string Name, string Version)? SplitSlashSeparatedKey(string key)
    {
        int slash = key.LastIndexOf('/');
        if (slash <= 0) return null;

        string version = key[(slash + 1)..];
        int peerSuffix = version.IndexOf('_');
        if (peerSuffix >= 0) version = version[..peerSuffix];

        return (key[..slash], version);
    }

    private static (string Name, string Version)? SplitAtSeparatedKey(string key)
    {
        int at = key.LastIndexOf('@');

        return at <= 0 ? null : (key[..at], key[(at + 1)..]);
    }

    [GeneratedRegex(@"lockfileVersion:\s*['""]?(\d+)")]
    private static partial Regex PnpmLockfileVersionRegex();

    [GeneratedRegex(@"^  \S")]
    private static partial Regex PnpmTopLevelKeyRegex();
}
