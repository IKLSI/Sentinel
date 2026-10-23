using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private const string NodeModulesSegment = "node_modules/";

    private static readonly string[] NpmDependencySections =
        ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

    private static void ParsePackageJson(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        using JsonDocument doc = JsonDocument.Parse(content);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("engines", out JsonElement engines) && engines.TryGetProperty("node", out JsonElement nodeProp))
        {
            string specification = nodeProp.GetString() ?? "";
            string v = VersionText.Clean(specification);
            if (VersionText.StartsWithDigit(v))
            {
                runtimes.Add(new Runtime
                {
                    ProjectId = projectId,
                    Name = "Node.js",
                    Version = v,
                    IsMinimumConstraint = !VersionText.IsExact(specification)
                });
            }
        }

        foreach ((string name, string version, bool isMinimumConstraint) in DetectNpmFrameworkRuntimes(root))
            runtimes.Add(new Runtime
            {
                ProjectId = projectId,
                Name = name,
                Version = version,
                IsMinimumConstraint = isMinimumConstraint
            });

        if (root.TryGetProperty("dependencies", out JsonElement prodDeps))
            ExtractNpmDeps(projectId, prodDeps, DependencyType.Prod, deps);

        if (root.TryGetProperty("devDependencies", out JsonElement devDeps))
            ExtractNpmDeps(projectId, devDeps, DependencyType.Dev, deps);
    }

    private static readonly Dictionary<string, string> NpmFrameworkRuntimes = new(StringComparer.OrdinalIgnoreCase)
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

    private static List<(string Name, string Version, bool IsMinimumConstraint)> DetectNpmFrameworkRuntimes(JsonElement root)
    {
        List<(string Name, string Version, bool IsMinimumConstraint)> detected = new List<(string, string, bool)>();

        foreach (string depsKey in new[] { "dependencies", "devDependencies" })
        {
            if (!root.TryGetProperty(depsKey, out JsonElement deps)) continue;
            foreach ((string? pkg, string? name) in NpmFrameworkRuntimes)
            {
                if (detected.Any(runtime => runtime.Name == name)) continue;
                if (!deps.TryGetProperty(pkg, out JsonElement vProp)) continue;

                string specification = vProp.GetString() ?? "";

                if (TryReadNpmVersion(specification, out string v, out bool _))
                    detected.Add((name, v, !VersionText.IsExact(specification)));
            }
        }

        return detected;
    }

    private static void ExtractNpmDeps(Guid projectId, JsonElement element, DependencyType type, List<Dependency> deps)
    {
        foreach (JsonProperty prop in element.EnumerateObject())
        {
            string specification = prop.Value.GetString() ?? "";
            if (!TryReadNpmVersion(specification, out string v, out bool pinned)) continue;
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = NpmAliasTarget(specification) ?? prop.Name,
                CurrentVersion = v,
                IsVersionPinned = pinned,
                Type = type,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
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

    private static bool TryReadNpmVersion(string specification, out string version, out bool pinned)
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

    private static void ParsePackageLockJson(Guid projectId, string content, List<Dependency> deps)
    {
        using JsonDocument doc = JsonDocument.Parse(content);
        JsonElement root = doc.RootElement;

        int lockfileVersion = root.TryGetProperty("lockfileVersion", out JsonElement vProp) ? vProp.GetInt32() : 1;

        if (lockfileVersion >= 2 && root.TryGetProperty("packages", out JsonElement packages))
        {
            HashSet<string> rootDependencyNames = RootDependencyNames(packages);

            foreach (JsonProperty pkg in packages.EnumerateObject())
            {
                int segment = pkg.Name.LastIndexOf(NodeModulesSegment, StringComparison.Ordinal);
                if (segment < 0) continue;

                string installedName = pkg.Name[(segment + NodeModulesSegment.Length)..];
                if (string.IsNullOrEmpty(installedName)) continue;

                string version = pkg.Value.TryGetProperty("version", out JsonElement ver) ? ver.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(version)) continue;

                string name = pkg.Value.TryGetProperty("name", out JsonElement realName)
                    && realName.GetString() is { Length: > 0 } aliasTarget
                        ? aliasTarget
                        : installedName;

                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = version,
                    Type = IsDevOnly(pkg.Value) ? DependencyType.Dev : DependencyType.Prod,
                    IsDirect = segment == 0 && rootDependencyNames.Contains(installedName),
                    Ecosystem = DependencyEcosystem.Npm,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
        else if (root.TryGetProperty("dependencies", out JsonElement dependencies))
        {
            ExtractPackageLockV1Deps(projectId, dependencies, deps);
        }
    }

    private static void ExtractPackageLockV1Deps(Guid projectId, JsonElement dependencies, List<Dependency> deps)
    {
        foreach (JsonProperty pkg in dependencies.EnumerateObject())
        {
            string version = pkg.Value.TryGetProperty("version", out JsonElement ver) ? ver.GetString() ?? "" : "";
            if (string.IsNullOrEmpty(version)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = pkg.Name,
                CurrentVersion = version,
                Type = IsDevOnly(pkg.Value) ? DependencyType.Dev : DependencyType.Prod,
                IsDirect = false,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });

            if (pkg.Value.TryGetProperty("dependencies", out JsonElement nested))
                ExtractPackageLockV1Deps(projectId, nested, deps);
        }
    }

    private static bool IsDevOnly(JsonElement package) =>
        IsFlagSet(package, "dev") || IsFlagSet(package, "devOptional");

    private static bool IsFlagSet(JsonElement package, string flag) =>
        package.TryGetProperty(flag, out JsonElement value) && value.ValueKind == JsonValueKind.True;

    private static HashSet<string> RootDependencyNames(JsonElement packages)
    {
        HashSet<string> names = new(StringComparer.Ordinal);
        if (!packages.TryGetProperty("", out JsonElement rootPackage)) return names;

        foreach (string section in NpmDependencySections)
        {
            if (!rootPackage.TryGetProperty(section, out JsonElement dependencies)
                || dependencies.ValueKind != JsonValueKind.Object) continue;

            foreach (JsonProperty dependency in dependencies.EnumerateObject()) names.Add(dependency.Name);
        }

        return names;
    }

    private static void ParseYarnLock(Guid projectId, string content, List<Dependency> deps)
    {
        string? currentName = null;
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();

            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                currentName = null;
                continue;
            }

            if (!line.StartsWith(' ') && line.EndsWith(':'))
            {
                string firstEntry = line.TrimEnd(':').Split(',')[0].Trim().Trim('"');
                currentName = YarnRegistryPackageName(firstEntry);
                continue;
            }

            if (currentName == null) continue;

            Match vMatch = YarnLockVersionRegex().Match(line.Trim());
            if (!vMatch.Success) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = currentName,
                CurrentVersion = vMatch.Groups[1].Value,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });
            currentName = null;
        }
    }

    private static string? YarnRegistryPackageName(string entry)
    {
        int nameEnd = entry.IndexOf('@', 1);
        if (nameEnd < 0) return null;

        string name = entry[..nameEnd];
        string range = entry[(nameEnd + 1)..];

        int protocolEnd = range.IndexOf(':');
        if (protocolEnd < 0) return name;
        if (!range[..protocolEnd].Equals("npm", StringComparison.OrdinalIgnoreCase)) return null;

        string target = range[(protocolEnd + 1)..];
        int targetNameEnd = target.IndexOf('@', 1);
        return targetNameEnd > 0 ? target[..targetNameEnd] : name;
    }

    private static void ParsePnpmLock(Guid projectId, string content, List<Dependency> deps)
    {
        Match versionMatch = PnpmLockfileVersionRegex().Match(content);
        int major = versionMatch.Success ? int.Parse(versionMatch.Groups[1].Value) : 9;

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

            if (!PnpmTopLevelKeyRegex().IsMatch(line)) continue;
            if (!line.EndsWith(':')) continue;

            string key = line.Trim().TrimEnd(':').Trim().Trim('\'', '"');
            (string? name, string? version) = ParsePnpmPackageKey(key, major);
            if (name == null || version == null)
            {
                current = null;
                continue;
            }

            current = new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            };
            deps.Add(current);
        }
    }

    private static (string?, string?) ParsePnpmPackageKey(string key, int major)
    {
        if (string.IsNullOrEmpty(key)) return (null, null);
        if (key.StartsWith('/')) key = key[1..];

        int paren = key.IndexOf('(');
        if (paren >= 0) key = key[..paren];

        string name, version;

        if (major <= 5)
        {
            int slash = key.LastIndexOf('/');
            if (slash <= 0) return (null, null);
            name = key[..slash];
            version = key[(slash + 1)..];
        }
        else
        {
            int at = key.LastIndexOf('@');
            if (at <= 0) return (null, null);
            name = key[..at];
            version = key[(at + 1)..];
        }

        if (name.Length == 0 || version.Length == 0 || !char.IsDigit(version[0]))
            return (null, null);

        return (name, version);
    }

    private static void ParseBunLock(Guid projectId, string content, List<Dependency> deps)
    {
        using JsonDocument doc = JsonDocument.Parse(content, new JsonDocumentOptions
        {
            AllowTrailingCommas = true,
            CommentHandling = JsonCommentHandling.Skip
        });

        if (!doc.RootElement.TryGetProperty("packages", out JsonElement packages)) return;

        foreach (JsonProperty package in packages.EnumerateObject())
        {
            if (package.Value.ValueKind != JsonValueKind.Array || package.Value.GetArrayLength() == 0) continue;

            string identifier = package.Value[0].GetString() ?? "";
            int at = identifier.LastIndexOf('@');
            if (at <= 0) continue;

            string name = identifier[..at];
            string version = identifier[(at + 1)..];
            if (!VersionText.StartsWithDigit(version)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    [GeneratedRegex(@"^version:?\s+[""']?([^""'\s]+)[""']?$")]
    private static partial Regex YarnLockVersionRegex();

    [GeneratedRegex(@"lockfileVersion:\s*['""]?(\d+)")]
    private static partial Regex PnpmLockfileVersionRegex();

    [GeneratedRegex(@"^  \S")]
    private static partial Regex PnpmTopLevelKeyRegex();
}
