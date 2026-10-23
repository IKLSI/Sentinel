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
        using JsonDocument doc = JsonDocument.Parse(content);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("require", out JsonElement require))
        {
            foreach (JsonProperty prop in require.EnumerateObject())
            {
                string specification = prop.Value.GetString() ?? "";
                string version = VersionText.Clean(specification);
                if (!VersionText.StartsWithDigit(version)) version = string.Empty;

                if (prop.Name.Equals("php", StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrEmpty(version))
                    {
                        runtimes.Add(new Runtime
                        {
                            ProjectId = projectId,
                            Name = "PHP",
                            Version = version,
                            IsMinimumConstraint = !VersionText.IsExact(specification)
                        });
                    }
                    continue;
                }

                if (prop.Name.Equals("laravel/framework", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(version))
                    runtimes.Add(new Runtime
                    {
                        ProjectId = projectId,
                        Name = "Laravel",
                        Version = version,
                        IsMinimumConstraint = !VersionText.IsExact(specification)
                    });

                if (SymfonyRuntimePackages.Contains(prop.Name) && !string.IsNullOrEmpty(version))
                    runtimes.Add(new Runtime
                    {
                        ProjectId = projectId,
                        Name = "Symfony",
                        Version = version,
                        IsMinimumConstraint = !VersionText.IsExact(specification)
                    });

                if (string.IsNullOrEmpty(version)) continue;
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = prop.Name,
                    CurrentVersion = version,
                    IsVersionPinned = VersionText.IsExact(specification),
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
                string specification = prop.Value.GetString() ?? "";
                string version = VersionText.Clean(specification);
                if (!VersionText.StartsWithDigit(version)) continue;
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = prop.Name,
                    CurrentVersion = version,
                    IsVersionPinned = VersionText.IsExact(specification),
                    Type = DependencyType.Dev,
                    Ecosystem = DependencyEcosystem.Composer,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
    }

    private static readonly Dictionary<string, string> GemFrameworkRuntimes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["rails"] = "Rails",
        ["sinatra"] = "Sinatra",
        ["hanami"] = "Hanami",
    };

    private static void ParseGemfile(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match rubyMatch = RubyVersionRegex().Match(content);
        if (rubyMatch.Success)
        {
            runtimes.Add(new Runtime
            {
                ProjectId = projectId,
                Name = "Ruby",
                Version = VersionText.Clean(rubyMatch.Groups[1].Value),
                IsMinimumConstraint = !VersionText.IsExact(rubyMatch.Groups[1].Value)
            });
        }

        Stack<bool> blocks = new Stack<bool>();

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.StartsWith('#')) continue;

            if (line == "end")
            {
                if (blocks.Count > 0) blocks.Pop();
                continue;
            }

            if (GemKeywordBlockOpeningRegex().IsMatch(line))
            {
                blocks.Push(false);
                continue;
            }

            if (GemBlockOpeningRegex().IsMatch(line))
            {
                bool isDevGroup = line.StartsWith("group", StringComparison.Ordinal)
                    && !GemProductionGroupRegex().IsMatch(line);
                blocks.Push(isDevGroup);
                continue;
            }

            Match m = GemPatternRegex().Match(line);
            if (!m.Success) continue;

            string name = m.Groups[1].Value;
            string specification = m.Groups[2].Success ? m.Groups[2].Value : "";
            string version = VersionText.Clean(specification);
            bool isDev = blocks.Contains(true) || GemInlineDevGroupRegex().IsMatch(line);

            if (GemFrameworkRuntimes.TryGetValue(name, out string? fw) && !string.IsNullOrEmpty(version))
                runtimes.Add(new Runtime
                {
                    ProjectId = projectId,
                    Name = fw,
                    Version = version,
                    IsMinimumConstraint = !VersionText.IsExact(specification)
                });

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                IsVersionPinned = VersionText.IsExact(specification),
                Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Gem,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseGemfileLock(Guid projectId, string content, List<Dependency> deps)
    {
        HashSet<string> directGems = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        List<Dependency> lockedGems = new List<Dependency>();
        string? section = null;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd('\r');

            if (line.Length > 0 && !line.StartsWith(' '))
            {
                section = line.Trim();
                continue;
            }

            if (section == "GEM")
            {
                Match spec = GemLockSpecRegex().Match(line);
                if (!spec.Success) continue;

                lockedGems.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = spec.Groups[1].Value,
                    CurrentVersion = GemLockPlatformRegex().Replace(spec.Groups[2].Value, string.Empty),
                    Type = DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Gem,
                    Status = DependencyStatus.UpToDate,
                });
            }
            else if (section == "DEPENDENCIES")
            {
                Match direct = GemLockDirectRegex().Match(line);
                if (direct.Success) directGems.Add(direct.Groups[1].Value);
            }
        }

        foreach (Dependency gem in lockedGems)
        {
            gem.IsDirect = directGems.Count == 0 || directGems.Contains(gem.Name);
            deps.Add(gem);
        }
    }

    [GeneratedRegex(@"\bdo(\s*\|[^|]*\|)?$")]
    private static partial Regex GemBlockOpeningRegex();

    [GeneratedRegex(@"^(?:if|unless|case|begin|while|until)\b")]
    private static partial Regex GemKeywordBlockOpeningRegex();

    [GeneratedRegex(@"^group\s*\(?\s*:(?:default|production)\b")]
    private static partial Regex GemProductionGroupRegex();

    [GeneratedRegex(@"\bgroups?:\s*(?:\[[^\]]*:(?:development|test)|:(?:development|test))")]
    private static partial Regex GemInlineDevGroupRegex();

    [GeneratedRegex(@"^ {4}([A-Za-z0-9_.\-]+) \(([^)]+)\)$")]
    private static partial Regex GemLockSpecRegex();

    [GeneratedRegex(@"-(?:x86|x64|arm|aarch|universal|java|mingw|mswin|darwin|linux)[\w\-]*$")]
    private static partial Regex GemLockPlatformRegex();

    [GeneratedRegex(@"^ {2}([A-Za-z0-9_.\-]+)")]
    private static partial Regex GemLockDirectRegex();

    private static void ParseCargoToml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        string? rustVersion = DetectRustVersion(content);
        if (rustVersion != null)
        {
            runtimes.Add(new Runtime
            {
                ProjectId = projectId,
                Name = "Rust",
                Version = rustVersion,
                IsMinimumConstraint = true
            });
        }

        bool inDev = false;
        bool inDeps = false;
        string? subTableName = null;
        bool subTableIsDev = false;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();

            if (line.StartsWith('['))
            {
                Match subTable = CargoDependencySubTableRegex().Match(line);
                subTableName = subTable.Success ? subTable.Groups["name"].Value.Trim('"') : null;
                subTableIsDev = subTable.Success && subTable.Groups["kind"].Value != "dependencies";

                bool isTargetSection = line.StartsWith("[target.", StringComparison.Ordinal);
                inDeps = line is "[dependencies]" or "[workspace.dependencies]"
                    || (isTargetSection && line.EndsWith(".dependencies]", StringComparison.Ordinal));
                inDev = line is "[dev-dependencies]" or "[build-dependencies]"
                    || (isTargetSection && line.EndsWith("-dependencies]", StringComparison.Ordinal));
                continue;
            }

            if (subTableName != null)
            {
                Match subTableVersion = CargoSubTableVersionRegex().Match(line);

                if (subTableVersion.Success)
                {
                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = subTableName,
                        CurrentVersion = VersionText.Clean(subTableVersion.Groups[1].Value),
                        IsVersionPinned = IsExactCargoRequirement(subTableVersion.Groups[1].Value),
                        Type = subTableIsDev ? DependencyType.Dev : DependencyType.Prod,
                        Ecosystem = DependencyEcosystem.Cargo,
                        Status = DependencyStatus.UpToDate,
                    });
                    subTableName = null;
                }

                continue;
            }

            if (!inDeps && !inDev) continue;
            if (line.StartsWith('#') || string.IsNullOrEmpty(line)) continue;

            int eqIdx = line.IndexOf('=');
            if (eqIdx < 0) continue;

            string name = line[..eqIdx].Trim();
            string value = line[(eqIdx + 1)..].Trim();

            Match simpleMatch = QuotedLiteralRegex().Match(value);
            if (simpleMatch.Success)
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = VersionText.Clean(simpleMatch.Groups[1].Value),
                    IsVersionPinned = IsExactCargoRequirement(simpleMatch.Groups[1].Value),
                    Type = inDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Cargo,
                    Status = DependencyStatus.UpToDate,
                });
                continue;
            }

            Match tableVersionMatch = InlineTableVersionRegex().Match(value);
            if (tableVersionMatch.Success)
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = VersionText.Clean(tableVersionMatch.Groups[1].Value),
                    IsVersionPinned = IsExactCargoRequirement(tableVersionMatch.Groups[1].Value),
                    Type = inDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Cargo,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
    }

    private static bool IsExactCargoRequirement(string requirement) =>
        requirement.TrimStart().StartsWith('=') && VersionText.IsExact(requirement.Trim());

    private static string? DetectRustVersion(string content)
    {
        Match minimumSupported = RustVersionRegex().Match(content);

        return minimumSupported.Success ? minimumSupported.Groups[1].Value : null;
    }

    private static void ParseCargoLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match block in TomlPackageBlockRegex().Matches(content))
        {
            string b = block.Groups[1].Value;
            Match nameMatch = TomlNameRegex().Match(b);
            Match versionMatch = TomlVersionRegex().Match(b);
            if (!nameMatch.Success || !versionMatch.Success) continue;
            if (!TomlSourceRegex().IsMatch(b)) continue;

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

    [GeneratedRegex(@"^\[(?:target\.[^\]]+\.)?(?:workspace\.)?(?<kind>dependencies|dev-dependencies|build-dependencies)\.(?<name>[^\]]+)\]$")]
    private static partial Regex CargoDependencySubTableRegex();

    [GeneratedRegex(@"^version\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex CargoSubTableVersionRegex();

    [GeneratedRegex(@"^ruby\s+['""]([^'""]+)['""]", RegexOptions.Multiline)]
    private static partial Regex RubyVersionRegex();

    [GeneratedRegex(@"^[""']([^""']+)[""']$")]
    private static partial Regex QuotedLiteralRegex();

    [GeneratedRegex(@"rust-version\s*=\s*[""']([\d.]+)[""']")]
    private static partial Regex RustVersionRegex();

    [GeneratedRegex(@"^\s*source\s*=", RegexOptions.Multiline)]
    private static partial Regex TomlSourceRegex();
}
