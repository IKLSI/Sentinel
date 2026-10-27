using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class AppleManifestParser : IManifestFileParser
{
    private const string PackageSwift = "Package.swift";
    private const string PackageResolved = "Package.resolved";
    private const string PodfileLock = "Podfile.lock";

    private static readonly HashSet<string> FileNames = FileNameSet(PackageSwift, PackageResolved, PodfileLock);

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(PackageSwift)) ParsePackageSwift(manifest, result);
        else if (manifest.Is(PackageResolved)) ParsePackageResolved(manifest, result);
        else ParsePodfileLock(manifest, result);
    }

    private static void ParsePackageSwift(ManifestDocument manifest, ManifestParseResult result)
    {
        Match toolsMatch = SwiftToolsVersionRegex().Match(manifest.Content);
        if (toolsMatch.Success)
            result.Runtimes.Add(NewRuntime(manifest.ProjectId, "Swift", toolsMatch.Groups[1].Value));
    }

    private static void ParsePackageResolved(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);

        if (ReadPins(doc.RootElement) is not { } pins) return;

        foreach (JsonElement pin in pins.EnumerateArray())
        {
            string location = (pin.TryGetProperty("location", out _)
                ? pin.StringProperty("location")
                : pin.StringProperty("repositoryURL")) ?? "";
            if (string.IsNullOrEmpty(location)) continue;

            string? version = pin.TryGetProperty("state", out JsonElement state) ? state.StringProperty("version") : null;
            if (string.IsNullOrEmpty(version)) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, NormalizeUrl(location), version,
                DependencyEcosystem.Swift));
        }
    }

    private static JsonElement? ReadPins(JsonElement root)
    {
        if (root.TryGetProperty("pins", out JsonElement pins)) return pins;

        return root.TryGetProperty("object", out JsonElement legacyObject)
            && legacyObject.TryGetProperty("pins", out JsonElement legacyPins)
                ? legacyPins
                : null;
    }

    private static string NormalizeUrl(string url)
    {
        string withoutScheme = UrlSchemeRegex().Replace(url.Trim(), "");
        string withoutGitSuffix = GitSuffixRegex().Replace(withoutScheme, "");
        return withoutGitSuffix.TrimEnd('/');
    }

    private static void ParsePodfileLock(ManifestDocument manifest, ManifestParseResult result)
    {
        HashSet<string> directPods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> lockedPods = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string? section = null;

        foreach (string raw in manifest.Content.Split('\n'))
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
            result.Dependencies.Add(new Dependency
            {
                ProjectId = manifest.ProjectId,
                Name = name,
                CurrentVersion = version,
                IsDirect = directPods.Count == 0 || directPods.Contains(name),
                Ecosystem = DependencyEcosystem.CocoaPods,
            });
        }
    }

    [GeneratedRegex(@"swift-tools-version:\s*([\d.]+)")]
    private static partial Regex SwiftToolsVersionRegex();

    [GeneratedRegex(@"^https?://")]
    private static partial Regex UrlSchemeRegex();

    [GeneratedRegex(@"\.git$")]
    private static partial Regex GitSuffixRegex();

    [GeneratedRegex(@"^  - ""?([^\s""(]+)""?(?: \(=?\s*([^)]+)\))?:?$")]
    private static partial Regex PodLineRegex();
}
