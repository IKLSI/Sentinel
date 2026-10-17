using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private static readonly HashSet<string> SymfonyRuntimePackages = new(StringComparer.OrdinalIgnoreCase)
    {
        "symfony/symfony",
        "symfony/framework-bundle",
        "symfony/runtime",
    };

    private static void ParseGoMod(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        bool inRequireBlock = false;

        foreach (string raw in content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            string line = raw.Trim();

            if (line.StartsWith("go ") && !inRequireBlock)
            {
                runtimes.Add(new Runtime { ProjectId = projectId, Name = "Go", Version = line[3..].Trim() });
                continue;
            }

            if (line.StartsWith("require (") || line == "require(") { inRequireBlock = true; continue; }
            if (line == ")") { inRequireBlock = false; continue; }

            string? module = null, version = null;

            if (inRequireBlock && !line.StartsWith("//"))
            {
                string[] parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2) { module = parts[0]; version = parts[1].TrimStart('v'); }
            }
            else if (line.StartsWith("require ") && !line.Contains('('))
            {
                string[] parts = line[8..].Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2) { module = parts[0]; version = parts[1].TrimStart('v'); }
            }

            if (module == null || version == null) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = module,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                IsDirect = !line.Contains("// indirect"),
                Ecosystem = DependencyEcosystem.Go,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseComposerJson(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("require", out JsonElement require))
            {
                foreach (JsonProperty prop in require.EnumerateObject())
                {
                    string version = VersionText.Clean(prop.Value.GetString() ?? "");

                    if (prop.Name.Equals("php", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(version))
                            runtimes.Add(new Runtime { ProjectId = projectId, Name = "PHP", Version = version });
                        continue;
                    }

                    if (prop.Name.Equals("laravel/framework", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(version))
                        runtimes.Add(new Runtime { ProjectId = projectId, Name = "Laravel", Version = version });

                    if (SymfonyRuntimePackages.Contains(prop.Name) && !string.IsNullOrEmpty(version))
                        runtimes.Add(new Runtime { ProjectId = projectId, Name = "Symfony", Version = version });

                    if (string.IsNullOrEmpty(version)) continue;
                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = prop.Name,
                        CurrentVersion = version,
                        Type = DependencyType.Prod,
                        Ecosystem = DependencyEcosystem.Composer,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }

            if (root.TryGetProperty("require-dev", out JsonElement requireDev))
            {
                foreach (JsonProperty prop in requireDev.EnumerateObject())
                {
                    string version = VersionText.Clean(prop.Value.GetString() ?? "");
                    if (string.IsNullOrEmpty(version)) continue;
                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = prop.Name,
                        CurrentVersion = version,
                        Type = DependencyType.Dev,
                        Ecosystem = DependencyEcosystem.Composer,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
    }

    private static void ParseGemfile(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match rubyMatch = Regex.Match(content, @"^ruby\s+['""]([^'""]+)['""]", RegexOptions.Multiline);
        if (rubyMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Ruby", Version = VersionText.Clean(rubyMatch.Groups[1].Value) });

        Dictionary<string, string> frameworkMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["rails"] = "Rails",
            ["sinatra"] = "Sinatra",
            ["hanami"] = "Hanami",
        };

        bool isInTest = false;
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.StartsWith("group") && (line.Contains(":test") || line.Contains(":development"))) { isInTest = true; continue; }
            if (line == "end") { isInTest = false; continue; }

            Match m = GemPatternRegex().Match(line);
            if (!m.Success) continue;

            string name = m.Groups[1].Value;
            string version = m.Groups[2].Success ? VersionText.Clean(m.Groups[2].Value) : "";

            if (frameworkMap.TryGetValue(name, out string? fw) && !string.IsNullOrEmpty(version))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = fw, Version = version });

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = isInTest ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Gem,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseCargoToml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        string? rustVersion = DetectRustVersion(content);
        if (rustVersion != null)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Rust", Version = rustVersion });

        bool inDev = false;
        bool inDeps = false;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();

            if (line.StartsWith('['))
            {
                inDeps = line is "[dependencies]" or "[workspace.dependencies]";
                inDev = line is "[dev-dependencies]" or "[build-dependencies]";
                continue;
            }

            if (!inDeps && !inDev) continue;
            if (line.StartsWith('#') || string.IsNullOrEmpty(line)) continue;

            int eqIdx = line.IndexOf('=');
            if (eqIdx < 0) continue;

            string name = line[..eqIdx].Trim();
            string value = line[(eqIdx + 1)..].Trim();

            Match simpleMatch = Regex.Match(value, @"^[""']([^""']+)[""']$");
            if (simpleMatch.Success)
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = simpleMatch.Groups[1].Value,
                    Type = inDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Cargo,
                    Status = DependencyStatus.UpToDate,
                });
                continue;
            }

            Match tableVersionMatch = Regex.Match(value, @"version\s*=\s*[""']([^""']+)[""']");
            if (tableVersionMatch.Success)
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = tableVersionMatch.Groups[1].Value,
                    Type = inDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Cargo,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
    }

    private static string? DetectRustVersion(string content)
    {
        Match minimumSupported = Regex.Match(content, @"rust-version\s*=\s*[""']([\d.]+)[""']");

        return minimumSupported.Success ? minimumSupported.Groups[1].Value : null;
    }

    private static void ParseCargoLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match block in Regex.Matches(content, @"\[\[package\]\](.*?)(?=\[\[package\]\]|\z)", RegexOptions.Singleline))
        {
            string b = block.Groups[1].Value;
            Match nameMatch = Regex.Match(b, @"^\s*name\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            Match versionMatch = Regex.Match(b, @"^\s*version\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            if (!nameMatch.Success || !versionMatch.Success) continue;
            if (!Regex.IsMatch(b, @"^\s*source\s*=", RegexOptions.Multiline)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = nameMatch.Groups[1].Value,
                CurrentVersion = versionMatch.Groups[1].Value,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Cargo,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseComposerLock(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            foreach ((string section, DependencyType type) in new[] { ("packages", DependencyType.Prod), ("packages-dev", DependencyType.Dev) })
            {
                if (!root.TryGetProperty(section, out JsonElement packages)) continue;

                foreach (JsonElement pkg in packages.EnumerateArray())
                {
                    string name = pkg.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
                    string version = pkg.TryGetProperty("version", out JsonElement v) ? VersionText.Clean(v.GetString() ?? "") : "";

                    if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = name,
                        CurrentVersion = version,
                        Type = type,
                        Ecosystem = DependencyEcosystem.Composer,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
    }
}
