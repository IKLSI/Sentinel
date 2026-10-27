using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class PythonManifestParser : IManifestFileParser
{
    private const string RequirementsTxt = "requirements.txt";
    private const string PyprojectToml = "pyproject.toml";
    private const string PipfileLock = "Pipfile.lock";
    private const string PoetryLock = "poetry.lock";
    private const string UvLock = "uv.lock";

    private static readonly HashSet<string> FileNames =
        FileNameSet(RequirementsTxt, PyprojectToml, PipfileLock, PoetryLock, UvLock);

    private static readonly Dictionary<string, string> FrameworkByPackage = new(StringComparer.OrdinalIgnoreCase)
    {
        ["django"] = "Django",
        ["flask"] = "Flask",
        ["fastapi"] = "FastAPI",
        ["tornado"] = "Tornado",
        ["aiohttp"] = "aiohttp",
    };

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(RequirementsTxt)) ParseRequirementsTxt(manifest, result);
        else if (manifest.Is(PyprojectToml)) ParsePyprojectToml(manifest, result);
        else if (manifest.Is(PipfileLock)) ParsePipfileLock(manifest, result);
        else if (manifest.Is(PoetryLock)) ParsePoetryLock(manifest, result);
        else ParseUvLock(manifest, result);
    }

    private static void ParseRequirementsTxt(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (string raw in manifest.Content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            string line = raw.Trim();
            if (line.StartsWith('#') || line.StartsWith('-') || string.IsNullOrEmpty(line)) continue;

            AddRequirement(manifest.ProjectId, line, DependencyType.Prod, result.Dependencies);
        }

        AddFrameworkRuntimes(manifest.ProjectId, result);
    }

    private static void ParsePyprojectToml(ManifestDocument manifest, ManifestParseResult result)
    {
        Guid projectId = manifest.ProjectId;
        string content = manifest.Content;

        AddPythonRuntimeConstraint(projectId, content, result.Runtimes);
        AddPoetryDependencies(projectId, content, result.Dependencies);

        foreach (string requirement in ReadProjectDependencies(content))
            AddRequirement(projectId, requirement, DependencyType.Prod, result.Dependencies);

        AddFrameworkRuntimes(projectId, result);
    }

    private static void ParsePipfileLock(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);
        JsonElement root = doc.RootElement;

        foreach ((string section, DependencyType type) in new[] { ("default", DependencyType.Prod), ("develop", DependencyType.Dev) })
        {
            if (!root.TryGetProperty(section, out JsonElement packages)) continue;

            foreach (JsonProperty package in packages.EnumerateObject())
            {
                string version = VersionText.Clean(package.Value.StringProperty("version") ?? "");

                if (string.IsNullOrEmpty(version)) continue;

                result.Dependencies.Add(NewDependency(manifest.ProjectId, package.Name, version,
                    DependencyEcosystem.PyPI, type));
            }
        }
    }

    private static void ParsePoetryLock(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (TomlManifest.LockPackage package in TomlManifest.ReadLockPackages(manifest.Content))
        {
            Match categoryMatch = PoetryCategoryRegex().Match(package.Block);
            bool isDev = categoryMatch.Success && categoryMatch.Groups[1].Value.Equals("dev", StringComparison.OrdinalIgnoreCase);

            result.Dependencies.Add(NewDependency(manifest.ProjectId, package.Name, package.Version,
                DependencyEcosystem.PyPI, isDev ? DependencyType.Dev : DependencyType.Prod));
        }
    }

    private static void ParseUvLock(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (TomlManifest.LockPackage package in TomlManifest.ReadLockPackages(manifest.Content))
        {
            if (UvLocalSourceRegex().IsMatch(package.Block)) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, package.Name, package.Version,
                DependencyEcosystem.PyPI));
        }
    }

    private static void AddFrameworkRuntimes(Guid projectId, ManifestParseResult result)
    {
        foreach (Dependency dep in result.Dependencies)
        {
            if (!FrameworkByPackage.TryGetValue(dep.Name, out string? framework)) continue;
            if (string.IsNullOrEmpty(dep.CurrentVersion)) continue;

            result.Runtimes.Add(NewRuntime(projectId, framework, dep.CurrentVersion, !dep.IsVersionPinned));
        }
    }

    private static void AddPoetryDependencies(Guid projectId, string content, List<Dependency> deps)
    {
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
                });
            }
        }
    }

    private static void AddPythonRuntimeConstraint(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match pythonMatch = PythonVersionRegex().Match(content);
        if (!pythonMatch.Success) return;

        string specification = pythonMatch.Groups[1].Value;
        string version = VersionText.Clean(specification);
        if (!VersionText.StartsWithDigit(version)) return;

        runtimes.Add(ConstrainedRuntime(projectId, "Python", version, specification));
    }

    private static string? ReadPoetrySpecification(string value)
    {
        if (value.StartsWith('"') || value.StartsWith('\''))
            return value.Trim('"', '\'');

        if (!value.StartsWith('{')) return null;

        Match inlineVersion = TomlManifest.InlineTableVersion().Match(value);

        return inlineVersion.Success ? inlineVersion.Groups[1].Value : null;
    }

    private static IEnumerable<string> ReadProjectDependencies(string content)
    {
        Match projectSection = ProjectSectionRegex().Match(content);
        if (!projectSection.Success) yield break;

        string section = projectSection.Groups[1].Value;
        Match start = ProjectDependenciesStartRegex().Match(section);
        if (!start.Success) yield break;

        char? quote = null;
        int itemStart = -1;

        for (int position = start.Index + start.Length; position < section.Length; position++)
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

    private static void AddRequirement(Guid projectId, string requirement, DependencyType type, List<Dependency> deps)
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
        });
    }

    private static (string Name, string Version, bool Pinned) ParseRequirementLine(string line)
    {
        if (RequirementUrlRegex().IsMatch(line))
        {
            Match egg = RequirementEggRegex().Match(line);

            return egg.Success ? (egg.Groups[1].Value, string.Empty, false) : (string.Empty, string.Empty, false);
        }

        line = StripRequirementSuffixes(line);

        Match name = RequirementNameRegex().Match(line);
        if (!name.Success) return (string.Empty, string.Empty, false);

        string constraints = line[name.Length..].Trim();

        if (constraints.StartsWith('['))
        {
            int extrasEnd = constraints.IndexOf(']');
            if (extrasEnd < 0) return (name.Groups[1].Value, string.Empty, false);
            constraints = constraints[(extrasEnd + 1)..];
        }

        Match pinned = PinnedVersionRegex().Match(constraints);
        if (pinned.Success)
        {
            string version = pinned.Groups[1].Value;
            bool isExact = !version.Contains('*') && !constraints.Contains(',');

            return (name.Groups[1].Value, version.TrimEnd('*', '.'), isExact);
        }

        Match minimum = MinimumVersionRegex().Match(constraints);

        return (name.Groups[1].Value, minimum.Success ? minimum.Groups[1].Value : string.Empty, false);
    }

    private static string StripRequirementSuffixes(string line)
    {
        int comment = line.IndexOf('#');
        if (comment >= 0) line = line[..comment];

        int environmentMarker = line.IndexOf(';');
        if (environmentMarker >= 0) line = line[..environmentMarker];

        return line.Trim();
    }

    [GeneratedRegex(@"(?:requires-python|^\s*python)\s*=\s*['""]([^'""]+)['""]", RegexOptions.Multiline)]
    private static partial Regex PythonVersionRegex();

    [GeneratedRegex(@"^\[tool\.poetry\.(?:group\.(?<group>[\w-]+)\.)?(?<legacyDev>dev-)?dependencies\][^\n]*\n(?<body>.*?)(?=^\[|\z)",
        RegexOptions.Multiline | RegexOptions.Singleline)]
    private static partial Regex PoetryDependencyBlockRegex();

    [GeneratedRegex(@"^(?<name>\w[\w\-\.]*)\s*=\s*(?<value>.+)$", RegexOptions.Multiline)]
    private static partial Regex PoetryDependencyLineRegex();

    [GeneratedRegex(@"^\[project\]\s*\n(.*?)(?=^\[|\z)", RegexOptions.Multiline | RegexOptions.Singleline)]
    private static partial Regex ProjectSectionRegex();

    [GeneratedRegex(@"^dependencies\s*=\s*\[", RegexOptions.Multiline)]
    private static partial Regex ProjectDependenciesStartRegex();

    [GeneratedRegex(@"^\s*category\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline)]
    private static partial Regex PoetryCategoryRegex();

    [GeneratedRegex(@"^\s*source\s*=\s*\{\s*(?:editable|virtual|directory|path)\s*=", RegexOptions.Multiline)]
    private static partial Regex UvLocalSourceRegex();

    [GeneratedRegex(@"^([A-Za-z0-9][A-Za-z0-9._-]*)")]
    private static partial Regex RequirementNameRegex();

    [GeneratedRegex(@"^(?:[A-Za-z][A-Za-z0-9+.\-]*://|git\+)")]
    private static partial Regex RequirementUrlRegex();

    [GeneratedRegex(@"#egg=([A-Za-z0-9][A-Za-z0-9._-]*)")]
    private static partial Regex RequirementEggRegex();

    [GeneratedRegex(@"==\s*([A-Za-z0-9][A-Za-z0-9.*\-_+!]*)")]
    private static partial Regex PinnedVersionRegex();

    [GeneratedRegex(@"(?:~=|>=|>)\s*([A-Za-z0-9][A-Za-z0-9.\-_+!]*)")]
    private static partial Regex MinimumVersionRegex();
}
