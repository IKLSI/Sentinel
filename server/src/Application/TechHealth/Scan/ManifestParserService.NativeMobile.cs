using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private static void ParseCMakeLists(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match cmakeVersionMatch = Regex.Match(content, @"cmake_minimum_required\s*\(\s*VERSION\s+([\d.]+)",
            RegexOptions.IgnoreCase);

        if (!cmakeVersionMatch.Success) return;

        runtimes.Add(new Runtime
        {
            ProjectId = projectId,
            Name = "CMake",
            Version = cmakeVersionMatch.Groups[1].Value.TrimEnd('.')
        });

        Match cxxStandard = Regex.Match(content, @"CMAKE_CXX_STANDARD\s+(\d+)", RegexOptions.IgnoreCase);

        if (cxxStandard.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "C++", Version = cxxStandard.Groups[1].Value });
    }

    private static void ParseMixExs(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match elixirMatch = Regex.Match(content, @"elixir:\s*[""']([^""']+)[""']");
        if (elixirMatch.Success)
        {
            runtimes.Add(new Runtime
            {
                ProjectId = projectId,
                Name = "Elixir",
                Version = VersionText.Clean(elixirMatch.Groups[1].Value),
                IsMinimumConstraint = !VersionText.IsExact(elixirMatch.Groups[1].Value)
            });
        }

        foreach (Match m in Regex.Matches(content, @"\{:(\w+)\s*,\s*[""']([\^~>=<\s]*\d[^""']*)[""']"))
        {
            string version = VersionText.Clean(m.Groups[2].Value);
            if (string.IsNullOrEmpty(version)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = m.Groups[1].Value,
                CurrentVersion = version,
                IsVersionPinned = VersionText.IsExact(m.Groups[2].Value),
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Hex,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseMixLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match m in Regex.Matches(content, @"[""']\w+[""']:\s*\{:hex,\s*:(\w+),\s*[""']([^""']+)[""']"))
        {
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = m.Groups[1].Value,
                CurrentVersion = m.Groups[2].Value,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Hex,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePubspecYaml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match envBlock = Regex.Match(content, @"^environment:\s*\n((?:[ \t]+.*\n?)*)", RegexOptions.Multiline);
        if (envBlock.Success)
        {
            string env = envBlock.Groups[1].Value;
            Match dartMatch = Regex.Match(env, @"sdk:\s*[""']?([\^~>=<\s]*)(\d[\d.]*)");
            if (dartMatch.Success)
            {
                runtimes.Add(new Runtime
                {
                    ProjectId = projectId,
                    Name = "Dart",
                    Version = dartMatch.Groups[2].Value,
                    IsMinimumConstraint = dartMatch.Groups[1].Value.Trim().Length > 0
                });
            }

            Match flutterMatch = Regex.Match(env, @"flutter:\s*[""']?([\^~>=<\s]*)(\d[\d.]*)");
            if (flutterMatch.Success)
            {
                runtimes.Add(new Runtime
                {
                    ProjectId = projectId,
                    Name = "Flutter",
                    Version = flutterMatch.Groups[2].Value,
                    IsMinimumConstraint = flutterMatch.Groups[1].Value.Trim().Length > 0
                });
            }
        }

        string? section = null;
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (line.Length == 0) continue;

            if (!line.StartsWith(' '))
            {
                section = line.StartsWith("dependencies:") ? "prod"
                        : line.StartsWith("dev_dependencies:") ? "dev"
                        : null;
                continue;
            }

            if (section == null) continue;

            Match m = Regex.Match(line, @"^  ([a-zA-Z0-9_]+):\s*(.*)$");
            if (!m.Success) continue;

            string rest = m.Groups[2].Value.Trim();
            if (rest.Length == 0) continue;

            string specification = rest.Trim('"', '\'');
            string version = VersionText.Clean(specification);
            if (version.Length == 0 || !char.IsDigit(version[0])) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = m.Groups[1].Value,
                CurrentVersion = version,
                IsVersionPinned = VersionText.IsExact(specification),
                Type = section == "dev" ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Pub,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePubspecLock(Guid projectId, string content, List<Dependency> deps)
    {
        bool inPackages = false;
        string? name = null, version = null, dependency = null, source = null;

        void Flush()
        {
            if (name != null && !string.IsNullOrEmpty(version) && (source == null || source == "hosted"))
            {
                bool isDev = dependency != null && dependency.Contains("dev");
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = version,
                    IsDirect = dependency == null || dependency.StartsWith("direct", StringComparison.Ordinal),
                    Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Pub,
                    Status = DependencyStatus.UpToDate,
                });
            }
            name = version = dependency = source = null;
        }

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (line.Length == 0) continue;

            if (!line.StartsWith(' '))
            {
                Flush();
                inPackages = line.StartsWith("packages:");
                continue;
            }

            if (!inPackages) continue;

            Match pkgStart = Regex.Match(line, @"^  (\S[^:]*):\s*$");
            if (pkgStart.Success) { Flush(); name = pkgStart.Groups[1].Value; continue; }

            Match prop = Regex.Match(line, @"^    (version|dependency|source):\s*[""']?([^""'\n]+?)[""']?\s*$");
            if (!prop.Success) continue;

            switch (prop.Groups[1].Value)
            {
                case "version": version = prop.Groups[2].Value; break;
                case "dependency": dependency = prop.Groups[2].Value; break;
                case "source": source = prop.Groups[2].Value; break;
            }
        }
        Flush();
    }

    private static void ParsePackageSwift(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match toolsMatch = Regex.Match(content, @"swift-tools-version:\s*([\d.]+)");
        if (toolsMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Swift", Version = toolsMatch.Groups[1].Value });
    }

    private static void ParsePackageResolved(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            JsonElement pins;
            if (root.TryGetProperty("pins", out JsonElement p)) pins = p;
            else if (root.TryGetProperty("object", out JsonElement obj) && obj.TryGetProperty("pins", out JsonElement p1)) pins = p1;
            else return;

            foreach (JsonElement pin in pins.EnumerateArray())
            {
                string location =
                    pin.TryGetProperty("location", out JsonElement l) ? l.GetString() ?? "" :
                    pin.TryGetProperty("repositoryURL", out JsonElement r) ? r.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(location)) continue;

                string? version = pin.TryGetProperty("state", out JsonElement state) && state.TryGetProperty("version", out JsonElement v)
                    ? v.GetString() : null;
                if (string.IsNullOrEmpty(version)) continue;

                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = NormalizeSwiftUrl(location),
                    CurrentVersion = version,
                    Type = DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Swift,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
        catch { }
    }

    private static string NormalizeSwiftUrl(string url)
    {
        string s = Regex.Replace(url.Trim(), @"^https?://", "");
        s = Regex.Replace(s, @"\.git$", "");
        return s.TrimEnd('/');
    }

    private static void ParsePodfileLock(Guid projectId, string content, List<Dependency> deps)
    {
        HashSet<string> directPods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> lockedPods = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string? section = null;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd('\r');

            if (line.Length > 0 && !line.StartsWith(' '))
            {
                section = line.TrimEnd(':');
                continue;
            }

            Match pod = PodLineRegex().Match(line);
            if (!pod.Success) continue;

            string name = pod.Groups[1].Value.Split('/')[0];

            if (section == "PODS" && pod.Groups[2].Success)
                lockedPods.TryAdd(name, pod.Groups[2].Value);
            else if (section == "DEPENDENCIES")
                directPods.Add(name);
        }

        foreach ((string name, string version) in lockedPods)
        {
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                IsDirect = directPods.Count == 0 || directPods.Contains(name),
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.CocoaPods,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    [GeneratedRegex(@"^  - ""?([^\s""(]+)""?(?: \(=?\s*([^)]+)\))?:?$")]
    private static partial Regex PodLineRegex();
}
