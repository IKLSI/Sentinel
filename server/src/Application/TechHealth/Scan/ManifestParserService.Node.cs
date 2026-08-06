using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private static void ParsePackageJson(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("engines", out JsonElement engines) && engines.TryGetProperty("node", out JsonElement nodeProp))
            {
                string v = VersionText.Clean(nodeProp.GetString() ?? "");
                if (!string.IsNullOrEmpty(v))
                    runtimes.Add(new Runtime { ProjectId = projectId, Name = "Node.js", Version = v });
            }

            foreach ((string name, string version) in DetectNpmFrameworkRuntimes(root))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = name, Version = version });

            if (root.TryGetProperty("dependencies", out JsonElement prodDeps))
                ExtractNpmDeps(projectId, prodDeps, DependencyType.Prod, deps);

            if (root.TryGetProperty("devDependencies", out JsonElement devDeps))
                ExtractNpmDeps(projectId, devDeps, DependencyType.Dev, deps);
        }
        catch { }
    }

    private static List<(string Name, string Version)> DetectNpmFrameworkRuntimes(JsonElement root)
    {
        Dictionary<string, string> frameworkMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
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
        };

        List<(string Name, string Version)> detected = new List<(string, string)>();

        foreach (string depsKey in new[] { "dependencies", "devDependencies" })
        {
            if (!root.TryGetProperty(depsKey, out JsonElement deps)) continue;
            foreach ((string? pkg, string? name) in frameworkMap)
            {
                if (detected.Any(runtime => runtime.Name == name)) continue;
                if (!deps.TryGetProperty(pkg, out JsonElement vProp)) continue;

                string v = VersionText.Clean(vProp.GetString() ?? "");
                if (!string.IsNullOrEmpty(v)) detected.Add((name, v));
            }
        }

        return detected;
    }

    private static void ExtractNpmDeps(Guid projectId, JsonElement element, DependencyType type, List<Dependency> deps)
    {
        foreach (JsonProperty prop in element.EnumerateObject())
        {
            string v = VersionText.Clean(prop.Value.GetString() ?? "");
            if (string.IsNullOrEmpty(v)) continue;
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = prop.Name,
                CurrentVersion = v,
                Type = type,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePackageLockJson(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            int lockfileVersion = root.TryGetProperty("lockfileVersion", out JsonElement vProp) ? vProp.GetInt32() : 1;

            if (lockfileVersion >= 2 && root.TryGetProperty("packages", out JsonElement packages))
            {
                foreach (JsonProperty pkg in packages.EnumerateObject())
                {
                    string key = pkg.Name;
                    if (!key.StartsWith("node_modules/", StringComparison.Ordinal)) continue;

                    string name = key["node_modules/".Length..];
                    if (string.IsNullOrEmpty(name)) continue;

                    if (name.Contains("/node_modules/")) continue;

                    string version = pkg.Value.TryGetProperty("version", out JsonElement ver) ? ver.GetString() ?? "" : "";
                    if (string.IsNullOrEmpty(version)) continue;

                    bool isDev = pkg.Value.TryGetProperty("dev", out JsonElement devProp) && devProp.GetBoolean();
                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = name,
                        CurrentVersion = version,
                        Type = isDev ? DependencyType.Dev : DependencyType.Prod,
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
        catch { }
    }

    private static void ExtractPackageLockV1Deps(Guid projectId, JsonElement dependencies, List<Dependency> deps)
    {
        foreach (JsonProperty pkg in dependencies.EnumerateObject())
        {
            string version = pkg.Value.TryGetProperty("version", out JsonElement ver) ? ver.GetString() ?? "" : "";
            if (string.IsNullOrEmpty(version)) continue;

            bool isDev = pkg.Value.TryGetProperty("dev", out JsonElement devProp) && devProp.GetBoolean();
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = pkg.Name,
                CurrentVersion = version,
                Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });

            if (pkg.Value.TryGetProperty("dependencies", out JsonElement nested))
                ExtractPackageLockV1Deps(projectId, nested, deps);
        }
    }

    private static void ParseYarnLock(Guid projectId, string content, List<Dependency> deps)
    {
        try
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
                    int atIdx = firstEntry.LastIndexOf('@');
                    currentName = atIdx > 0 ? firstEntry[..atIdx] : null;
                    continue;
                }

                if (currentName == null) continue;

                Match vMatch = Regex.Match(line.Trim(), @"^version:?\s+[""']?([^""'\s]+)[""']?$");
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
        catch { }
    }

    private static void ParsePnpmLock(Guid projectId, string content, List<Dependency> deps)
    {
        Match versionMatch = Regex.Match(content, @"lockfileVersion:\s*['""]?(\d+)");
        int major = versionMatch.Success ? int.Parse(versionMatch.Groups[1].Value) : 9;

        bool inPackages = false;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (string.IsNullOrEmpty(line)) continue;

            if (!line.StartsWith(' '))
            {
                inPackages = line.StartsWith("packages:", StringComparison.Ordinal);
                continue;
            }

            if (!inPackages) continue;
            if (!Regex.IsMatch(line, @"^  \S")) continue;
            if (!line.EndsWith(':')) continue;

            string key = line.Trim().TrimEnd(':').Trim().Trim('\'', '"');
            (string? name, string? version) = ParsePnpmPackageKey(key, major);
            if (name == null || version == null) continue;

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

}
