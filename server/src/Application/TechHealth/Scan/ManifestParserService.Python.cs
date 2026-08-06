using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private static void ParseRequirementsTxt(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Dictionary<string, string> frameworkIndicators = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["django"] = "Django",
            ["flask"] = "Flask",
            ["fastapi"] = "FastAPI",
            ["tornado"] = "Tornado",
            ["aiohttp"] = "aiohttp",
        };

        foreach (string raw in content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            string line = raw.Trim();
            if (line.StartsWith('#') || line.StartsWith('-') || string.IsNullOrEmpty(line)) continue;

            (string name, string version) = ParseRequirementLine(line);

            if (string.IsNullOrEmpty(name)) continue;

            if (frameworkIndicators.TryGetValue(name, out string? fw) && !string.IsNullOrEmpty(version))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = fw, Version = version });

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.PyPI,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static (string Name, string Version) ParseRequirementLine(string line)
    {
        int comment = line.IndexOf('#');
        if (comment >= 0) line = line[..comment];

        int environmentMarker = line.IndexOf(';');
        if (environmentMarker >= 0) line = line[..environmentMarker];

        line = line.Trim();

        Match name = RequirementNameRegex().Match(line);
        if (!name.Success) return (string.Empty, string.Empty);

        string constraints = line[name.Length..].Trim();

        if (constraints.StartsWith('['))
        {
            int extrasEnd = constraints.IndexOf(']');
            if (extrasEnd < 0) return (name.Groups[1].Value, string.Empty);
            constraints = constraints[(extrasEnd + 1)..];
        }

        Match pinned = RequirementPinnedVersionRegex().Match(constraints);
        if (pinned.Success) return (name.Groups[1].Value, pinned.Groups[1].Value.TrimEnd('*', '.'));

        Match minimum = RequirementMinimumVersionRegex().Match(constraints);

        return (name.Groups[1].Value, minimum.Success ? minimum.Groups[1].Value : string.Empty);
    }

    private static void ParsePyprojectToml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match pythonMatch = Regex.Match(content, @"python\s*=\s*['""]([^'""]+)['""]");
        if (pythonMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Python", Version = VersionText.Clean(pythonMatch.Groups[1].Value) });

        MatchCollection poetryDepBlocks = Regex.Matches(content,
            @"\[tool\.poetry(?:\.group\.\w+)?\.dependencies\](.*?)(?=\[|\z)",
            RegexOptions.Singleline);

        foreach (Match block in poetryDepBlocks)
        {
            bool isDevBlock = block.Value.Contains("dev");
            foreach (Match dep in Regex.Matches(block.Groups[1].Value, @"^(\w[\w\-\.]+)\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline))
            {
                string name = dep.Groups[1].Value;
                if (name.Equals("python", StringComparison.OrdinalIgnoreCase)) continue;
                string version = VersionText.Clean(dep.Groups[2].Value);
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = version,
                    Type = isDevBlock ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.PyPI,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }

        Match pep517Match = Regex.Match(content, @"\[project\].*?dependencies\s*=\s*\[(.*?)\]", RegexOptions.Singleline);
        if (pep517Match.Success)
        {
            foreach (Match dep in Regex.Matches(pep517Match.Groups[1].Value, @"[""']([a-zA-Z0-9\-_\.]+)[>=<~!]+([a-zA-Z0-9.\-_]+)[""']"))
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = dep.Groups[1].Value,
                    CurrentVersion = dep.Groups[2].Value,
                    Type = DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.PyPI,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }

        Dictionary<string, string> frameworkMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["django"] = "Django",
            ["flask"] = "Flask",
            ["fastapi"] = "FastAPI",
        };
        foreach (Dependency dep in deps)
        {
            if (frameworkMap.TryGetValue(dep.Name, out string? fw) && !string.IsNullOrEmpty(dep.CurrentVersion))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = fw, Version = dep.CurrentVersion });
        }
    }

    private static void ParsePoetryLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match block in Regex.Matches(content, @"\[\[package\]\](.*?)(?=\[\[package\]\]|\z)", RegexOptions.Singleline))
        {
            string b = block.Groups[1].Value;
            Match nameMatch = Regex.Match(b, @"^\s*name\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            Match versionMatch = Regex.Match(b, @"^\s*version\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            if (!nameMatch.Success || !versionMatch.Success) continue;

            Match categoryMatch = Regex.Match(b, @"^\s*category\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            bool isDev = categoryMatch.Success && categoryMatch.Groups[1].Value.Equals("dev", StringComparison.OrdinalIgnoreCase);

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = nameMatch.Groups[1].Value,
                CurrentVersion = versionMatch.Groups[1].Value,
                Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.PyPI,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePipfileLock(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            foreach ((string section, DependencyType type) in new[] { ("default", DependencyType.Prod), ("develop", DependencyType.Dev) })
            {
                if (!root.TryGetProperty(section, out JsonElement packages)) continue;

                foreach (JsonProperty pkg in packages.EnumerateObject())
                {
                    string version = pkg.Value.TryGetProperty("version", out JsonElement vProp)
                        ? VersionText.Clean(vProp.GetString() ?? "")
                        : "";

                    if (string.IsNullOrEmpty(version)) continue;

                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = pkg.Name,
                        CurrentVersion = version,
                        Type = type,
                        Ecosystem = DependencyEcosystem.PyPI,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
    }

}
