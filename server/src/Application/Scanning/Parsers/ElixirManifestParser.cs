using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class ElixirManifestParser : IManifestFileParser
{
    private const string MixExs = "mix.exs";
    private const string MixLock = "mix.lock";

    private static readonly HashSet<string> FileNames = FileNameSet(MixExs, MixLock);

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(MixExs)) ParseMixExs(manifest, result);
        else ParseMixLock(manifest, result);
    }

    private static void ParseMixExs(ManifestDocument manifest, ManifestParseResult result)
    {
        Match elixirMatch = ElixirVersionRegex().Match(manifest.Content);
        if (elixirMatch.Success)
        {
            string specification = elixirMatch.Groups[1].Value;
            result.Runtimes.Add(ConstrainedRuntime(manifest.ProjectId, "Elixir", VersionText.Clean(specification),
                specification));
        }

        foreach (Match m in DependencyRegex().Matches(manifest.Content))
        {
            string version = VersionText.Clean(m.Groups[2].Value);
            if (string.IsNullOrEmpty(version)) continue;

            result.Dependencies.Add(new Dependency
            {
                ProjectId = manifest.ProjectId,
                Name = m.Groups[1].Value,
                CurrentVersion = version,
                IsVersionPinned = VersionText.IsExact(m.Groups[2].Value),
                Ecosystem = DependencyEcosystem.Hex,
            });
        }
    }

    private static void ParseMixLock(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (Match m in HexEntryRegex().Matches(manifest.Content))
        {
            result.Dependencies.Add(NewDependency(manifest.ProjectId, m.Groups[1].Value, m.Groups[2].Value,
                DependencyEcosystem.Hex));
        }
    }

    [GeneratedRegex(@"elixir:\s*[""']([^""']+)[""']")]
    private static partial Regex ElixirVersionRegex();

    [GeneratedRegex(@"\{:(\w+)\s*,\s*[""']([\^~>=<\s]*\d[^""']*)[""']")]
    private static partial Regex DependencyRegex();

    [GeneratedRegex(@"[""']\w+[""']:\s*\{:hex,\s*:(\w+),\s*[""']([^""']+)[""']")]
    private static partial Regex HexEntryRegex();
}
