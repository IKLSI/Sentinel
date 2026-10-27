using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class RubyManifestParser : IManifestFileParser
{
    private const string Gemfile = "Gemfile";
    private const string GemfileLock = "Gemfile.lock";

    private static readonly HashSet<string> FileNames = FileNameSet(Gemfile, GemfileLock);

    private static readonly Dictionary<string, string> FrameworkRuntimes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["rails"] = "Rails",
        ["sinatra"] = "Sinatra",
        ["hanami"] = "Hanami",
    };

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(Gemfile)) ParseGemfile(manifest, result);
        else ParseGemfileLock(manifest, result);
    }

    private static void ParseGemfile(ManifestDocument manifest, ManifestParseResult result)
    {
        Guid projectId = manifest.ProjectId;
        string content = manifest.Content;

        Match rubyMatch = RubyVersionRegex().Match(content);
        if (rubyMatch.Success)
        {
            string specification = rubyMatch.Groups[1].Value;
            result.Runtimes.Add(ConstrainedRuntime(projectId, "Ruby", VersionText.Clean(specification), specification));
        }

        Stack<bool> openBlocksAreDevGroups = new Stack<bool>();

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.StartsWith('#')) continue;
            if (TrackBlock(line, openBlocksAreDevGroups)) continue;

            Match gem = GemRegex().Match(line);
            if (!gem.Success) continue;

            bool isDev = openBlocksAreDevGroups.Contains(true) || InlineDevGroupRegex().IsMatch(line);
            AddGem(projectId, gem, isDev, result);
        }
    }

    private static bool TrackBlock(string line, Stack<bool> openBlocksAreDevGroups)
    {
        if (line == "end")
        {
            if (openBlocksAreDevGroups.Count > 0) openBlocksAreDevGroups.Pop();
            return true;
        }

        if (KeywordBlockOpeningRegex().IsMatch(line))
        {
            openBlocksAreDevGroups.Push(false);
            return true;
        }

        if (!BlockOpeningRegex().IsMatch(line)) return false;

        bool isDevGroup = line.StartsWith("group", StringComparison.Ordinal)
            && !ProductionGroupRegex().IsMatch(line);
        openBlocksAreDevGroups.Push(isDevGroup);
        return true;
    }

    private static void AddGem(Guid projectId, Match gem, bool isDev, ManifestParseResult result)
    {
        string name = gem.Groups[1].Value;
        string specification = gem.Groups[2].Success ? gem.Groups[2].Value : "";
        string version = VersionText.Clean(specification);

        if (FrameworkRuntimes.TryGetValue(name, out string? framework) && !string.IsNullOrEmpty(version))
            result.Runtimes.Add(ConstrainedRuntime(projectId, framework, version, specification));

        result.Dependencies.Add(new Dependency
        {
            ProjectId = projectId,
            Name = name,
            CurrentVersion = version,
            IsVersionPinned = VersionText.IsExact(specification),
            Type = isDev ? DependencyType.Dev : DependencyType.Prod,
            Ecosystem = DependencyEcosystem.Gem,
        });
    }

    private static void ParseGemfileLock(ManifestDocument manifest, ManifestParseResult result)
    {
        HashSet<string> directGems = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        List<Dependency> lockedGems = new List<Dependency>();
        string? section = null;

        foreach (string raw in manifest.Content.Split('\n'))
        {
            string line = raw.TrimEnd('\r');

            if (line.Length > 0 && !line.StartsWith(' '))
            {
                section = line.Trim();
                continue;
            }

            if (section == "GEM")
            {
                Match spec = LockSpecRegex().Match(line);
                if (!spec.Success) continue;

                string version = PlatformSuffixRegex().Replace(spec.Groups[2].Value, string.Empty);
                lockedGems.Add(NewDependency(manifest.ProjectId, spec.Groups[1].Value, version, DependencyEcosystem.Gem));
            }
            else if (section == "DEPENDENCIES")
            {
                Match direct = LockDirectRegex().Match(line);
                if (direct.Success) directGems.Add(direct.Groups[1].Value);
            }
        }

        foreach (Dependency gem in lockedGems)
        {
            gem.IsDirect = directGems.Count == 0 || directGems.Contains(gem.Name);
            result.Dependencies.Add(gem);
        }
    }

    [GeneratedRegex(@"^gem\s+['""]([^'""]+)['""](?:\s*,\s*['""]([^'""]*)['""])?", RegexOptions.Multiline)]
    private static partial Regex GemRegex();

    [GeneratedRegex(@"^ruby\s+['""]([^'""]+)['""]", RegexOptions.Multiline)]
    private static partial Regex RubyVersionRegex();

    [GeneratedRegex(@"\bdo(\s*\|[^|]*\|)?$")]
    private static partial Regex BlockOpeningRegex();

    [GeneratedRegex(@"^(?:if|unless|case|begin|while|until)\b")]
    private static partial Regex KeywordBlockOpeningRegex();

    [GeneratedRegex(@"^group\s*\(?\s*:(?:default|production)\b")]
    private static partial Regex ProductionGroupRegex();

    [GeneratedRegex(@"\bgroups?:\s*(?:\[[^\]]*:(?:development|test)|:(?:development|test))")]
    private static partial Regex InlineDevGroupRegex();

    [GeneratedRegex(@"^ {4}([A-Za-z0-9_.\-]+) \(([^)]+)\)$")]
    private static partial Regex LockSpecRegex();

    [GeneratedRegex(@"-(?:x86|x64|arm|aarch|universal|java|mingw|mswin|darwin|linux)[\w\-]*$")]
    private static partial Regex PlatformSuffixRegex();

    [GeneratedRegex(@"^ {2}([A-Za-z0-9_.\-]+)")]
    private static partial Regex LockDirectRegex();
}
