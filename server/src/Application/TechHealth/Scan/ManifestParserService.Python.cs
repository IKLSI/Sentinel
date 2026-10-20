using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private static readonly Dictionary<string, string> PythonFrameworkIndicators = new(StringComparer.OrdinalIgnoreCase)
    {
        ["django"] = "Django",
        ["flask"] = "Flask",
        ["fastapi"] = "FastAPI",
        ["tornado"] = "Tornado",
        ["aiohttp"] = "aiohttp",
    };

    private static void ParseRequirementsTxt(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        foreach (string raw in content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            string line = raw.Trim();
            if (line.StartsWith('#') || line.StartsWith('-') || string.IsNullOrEmpty(line)) continue;

            AddPythonRequirement(projectId, line, DependencyType.Prod, deps);
        }

        AddPythonFrameworkRuntimes(projectId, deps, runtimes);
    }

    private static void AddPythonRequirement(Guid projectId, string requirement, DependencyType type,
        List<Dependency> deps)
    {
        (string name, string version, bool pinned) = ParseRequirementLine(requirement);

        if (string.IsNullOrEmpty(name)) return;

        deps.Add(new Dependency
        {
            ProjectId = projectId,
            Name = name,
            CurrentVersion = version,
            IsVersionPinned = pinned,
            Type = type,
            Ecosystem = DependencyEcosystem.PyPI,
            Status = DependencyStatus.UpToDate,
        });
    }

    private static void AddPythonFrameworkRuntimes(Guid projectId, List<Dependency> deps, List<Runtime> runtimes)
    {
        foreach (Dependency dep in deps)
        {
            if (PythonFrameworkIndicators.TryGetValue(dep.Name, out string? framework)
                && !string.IsNullOrEmpty(dep.CurrentVersion))
            {
                runtimes.Add(new Runtime { ProjectId = projectId, Name = framework, Version = dep.CurrentVersion });
            }
        }
    }

    private static (string Name, string Version, bool Pinned) ParseRequirementLine(string line)
    {
        int comment = line.IndexOf('#');
        if (comment >= 0) line = line[..comment];

        int environmentMarker = line.IndexOf(';');
        if (environmentMarker >= 0) line = line[..environmentMarker];

        line = line.Trim();

        Match name = RequirementNameRegex().Match(line);
        if (!name.Success) return (string.Empty, string.Empty, false);

        string constraints = line[name.Length..].Trim();

        if (constraints.StartsWith('['))
        {
            int extrasEnd = constraints.IndexOf(']');
            if (extrasEnd < 0) return (name.Groups[1].Value, string.Empty, false);
            constraints = constraints[(extrasEnd + 1)..];
        }

        Match pinned = RequirementPinnedVersionRegex().Match(constraints);
        if (pinned.Success)
        {
            string version = pinned.Groups[1].Value;
            bool isExact = !version.Contains('*') && !constraints.Contains(',');

            return (name.Groups[1].Value, version.TrimEnd('*', '.'), isExact);
        }

        Match minimum = RequirementMinimumVersionRegex().Match(constraints);

        return (name.Groups[1].Value, minimum.Success ? minimum.Groups[1].Value : string.Empty, false);
    }

    private static void ParsePyprojectToml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        AddPythonRuntimeConstraint(projectId, content, runtimes);

        foreach (Match block in PoetryDependencyBlockRegex().Matches(content))
        {
            string group = block.Groups["group"].Value;
            bool isDevBlock = block.Groups["legacyDev"].Success
                || (group.Length > 0 && !group.Equals("main", StringComparison.OrdinalIgnoreCase));

            foreach (Match dep in PoetryDependencyLineRegex().Matches(block.Groups["body"].Value))
            {
                string name = dep.Groups["name"].Value;
                if (name.Equals("python", StringComparison.OrdinalIgnoreCase)) continue;

                string? specification = ReadPoetrySpecification(dep.Groups["value"].Value.Trim());
                if (specification == null) continue;

                string version = VersionText.Clean(specification);

                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = VersionText.StartsWithDigit(version) ? version : string.Empty,
                    IsVersionPinned = VersionText.IsExact(specification),
                    Type = isDevBlock ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.PyPI,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }

        foreach (string requirement in ReadProjectDependencies(content))
            AddPythonRequirement(projectId, requirement, DependencyType.Prod, deps);

        AddPythonFrameworkRuntimes(projectId, deps, runtimes);
    }

    private static void AddPythonRuntimeConstraint(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match pythonMatch = PythonVersionRegex().Match(content);
        if (!pythonMatch.Success) return;

        string specification = pythonMatch.Groups[1].Value;
        string version = VersionText.Clean(specification);
        if (!VersionText.StartsWithDigit(version)) return;

        runtimes.Add(new Runtime
        {
            ProjectId = projectId,
            Name = "Python",
            Version = version,
            IsMinimumConstraint = !VersionText.IsExact(specification)
        });
    }

    private static string? ReadPoetrySpecification(string value)
    {
        if (value.StartsWith('"') || value.StartsWith('\''))
            return value.Trim('"', '\'');

        if (!value.StartsWith('{')) return null;

        Match inlineVersion = InlineTableVersionRegex().Match(value);

        return inlineVersion.Success ? inlineVersion.Groups[1].Value : null;
    }

    private static IEnumerable<string> ReadProjectDependencies(string content)
    {
        Match projectSection = ProjectSectionRegex().Match(content);
        if (!projectSection.Success) yield break;

        string section = projectSection.Groups[1].Value;
        Match start = ProjectDependenciesStartRegex().Match(section);
        if (!start.Success) yield break;

        int position = start.Index + start.Length;
        char? quote = null;
        int itemStart = -1;

        for (; position < section.Length; position++)
        {
            char current = section[position];

            if (quote == null)
            {
                if (current == ']') yield break;
                if (current is '"' or '\'')
                {
                    quote = current;
                    itemStart = position + 1;
                }

                continue;
            }

            if (current != quote) continue;

            yield return section[itemStart..position];
            quote = null;
        }
    }

    private static void ParsePoetryLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match block in TomlPackageBlockRegex().Matches(content))
        {
            string b = block.Groups[1].Value;
            Match nameMatch = TomlNameRegex().Match(b);
            Match versionMatch = TomlVersionRegex().Match(b);
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

    private static void ParseUvLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match block in TomlPackageBlockRegex().Matches(content))
        {
            string b = block.Groups[1].Value;
            Match nameMatch = TomlNameRegex().Match(b);
            Match versionMatch = TomlVersionRegex().Match(b);
            if (!nameMatch.Success || !versionMatch.Success) continue;
            if (UvLocalSourceRegex().IsMatch(b)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = nameMatch.Groups[1].Value,
                CurrentVersion = versionMatch.Groups[1].Value,
                Type = DependencyType.Prod,
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

    [GeneratedRegex(@"(?:requires-python|^\s*python)\s*=\s*['""]([^'""]+)['""]", RegexOptions.Multiline)]
    private static partial Regex PythonVersionRegex();

    [GeneratedRegex(@"^\[tool\.poetry\.(?:group\.(?<group>[\w-]+)\.)?(?<legacyDev>dev-)?dependencies\][^\n]*\n(?<body>.*?)(?=^\[|\z)",
        RegexOptions.Multiline | RegexOptions.Singleline)]
    private static partial Regex PoetryDependencyBlockRegex();

    [GeneratedRegex(@"^(?<name>\w[\w\-\.]*)\s*=\s*(?<value>.+)$", RegexOptions.Multiline)]
    private static partial Regex PoetryDependencyLineRegex();

    [GeneratedRegex(@"version\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex InlineTableVersionRegex();

    [GeneratedRegex(@"^\[project\]\s*\n(.*?)(?=^\[|\z)", RegexOptions.Multiline | RegexOptions.Singleline)]
    private static partial Regex ProjectSectionRegex();

    [GeneratedRegex(@"^dependencies\s*=\s*\[", RegexOptions.Multiline)]
    private static partial Regex ProjectDependenciesStartRegex();

    [GeneratedRegex(@"\[\[package\]\](.*?)(?=\[\[package\]\]|\z)", RegexOptions.Singleline)]
    private static partial Regex TomlPackageBlockRegex();

    [GeneratedRegex(@"^\s*name\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline)]
    private static partial Regex TomlNameRegex();

    [GeneratedRegex(@"^\s*version\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline)]
    private static partial Regex TomlVersionRegex();

    [GeneratedRegex(@"^\s*source\s*=\s*\{\s*(?:editable|virtual|directory|path)\s*=", RegexOptions.Multiline)]
    private static partial Regex UvLocalSourceRegex();
}
