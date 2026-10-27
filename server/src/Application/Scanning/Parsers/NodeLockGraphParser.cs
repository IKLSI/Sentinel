using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class NodeLockGraphParser : IManifestFileParser
{
    private const string YarnLock = "yarn.lock";
    private const string BunLock = "bun.lock";
    private const int YarnPropertyIndent = 2;
    private const int YarnEdgeIndent = 4;
    private const int BunMetadataIndex = 2;

    private static readonly HashSet<string> FileNames = FileNameSet(YarnLock, BunLock);

    private static readonly HashSet<string> YarnEdgeSections = new(StringComparer.Ordinal)
    {
        "dependencies:",
        "optionalDependencies:"
    };

    private static readonly JsonDocumentOptions BunJsonOptions = new()
    {
        AllowTrailingCommas = true,
        CommentHandling = JsonCommentHandling.Skip
    };

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(YarnLock)) ParseYarnLock(manifest, result);
        else ParseBunLock(manifest, result);
    }

    private static void ParseYarnLock(ManifestDocument manifest, ManifestParseResult result)
    {
        string[] lines = manifest.Content.Split('\n');
        string? currentName = null;
        foreach (string raw in lines)
        {
            string line = raw.TrimEnd();

            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                currentName = null;
                continue;
            }

            if (IsYarnEntryHeader(line))
            {
                currentName = YarnRegistryPackageName(YarnHeaderEntries(line)[0]);
                continue;
            }

            if (currentName == null) continue;

            Match versionMatch = YarnVersionRegex().Match(line.Trim());
            if (!versionMatch.Success) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, currentName, versionMatch.Groups[1].Value,
                DependencyEcosystem.Npm));
            currentName = null;
        }

        result.Graph = ReadYarnLockGraph(lines);
    }

    private static LockGraph ReadYarnLockGraph(string[] lines)
    {
        Dictionary<string, string> nodeByEntry = new(StringComparer.Ordinal);
        List<(string Node, List<string> Children)> rawEdges = new();

        string? currentNode = null;
        List<string> currentEntries = new();
        List<string> currentChildren = new();
        bool inEdgeSection = false;

        void Flush()
        {
            if (currentNode != null) rawEdges.Add((currentNode, currentChildren));
            currentNode = null;
            currentEntries = new List<string>();
            currentChildren = new List<string>();
            inEdgeSection = false;
        }

        foreach (string raw in lines)
        {
            string line = raw.TrimEnd();

            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                Flush();
                continue;
            }

            if (IsYarnEntryHeader(line))
            {
                Flush();
                currentEntries = YarnHeaderEntries(line);
                continue;
            }

            string trimmed = line.Trim();
            int indent = line.Length - line.TrimStart().Length;

            if (indent == YarnPropertyIndent)
            {
                inEdgeSection = YarnEdgeSections.Contains(trimmed);
                currentNode = RegisterYarnNode(trimmed, currentEntries, nodeByEntry) ?? currentNode;
                continue;
            }

            if (indent == YarnEdgeIndent && inEdgeSection && YarnEdgeRegex().Match(trimmed) is { Success: true } edge)
                currentChildren.Add(NormalizeYarnEntry($"{edge.Groups[1].Value}@{edge.Groups[2].Value}"));
        }

        Flush();

        return new LockGraph(ResolveYarnEdges(rawEdges, nodeByEntry));
    }

    private static string? RegisterYarnNode(string property, List<string> entries,
        Dictionary<string, string> nodeByEntry)
    {
        Match version = YarnVersionRegex().Match(property);
        string? name = entries.Count > 0 ? YarnRegistryPackageName(entries[0]) : null;
        if (!version.Success || name == null) return null;

        string node = LockGraph.NodeId(name, version.Groups[1].Value);
        foreach (string entry in entries) nodeByEntry[NormalizeYarnEntry(entry)] = node;

        return node;
    }

    private static Dictionary<string, List<string>> ResolveYarnEdges(
        List<(string Node, List<string> Children)> rawEdges, Dictionary<string, string> nodeByEntry)
    {
        Dictionary<string, List<string>> edges = new(StringComparer.Ordinal);

        foreach ((string node, List<string> children) in rawEdges)
        {
            List<string> resolved = children
                .Select(child => nodeByEntry.GetValueOrDefault(child))
                .OfType<string>()
                .ToList();

            if (edges.TryGetValue(node, out List<string>? existing)) existing.AddRange(resolved);
            else edges[node] = resolved;
        }

        return edges;
    }

    private static bool IsYarnEntryHeader(string line) => !line.StartsWith(' ') && line.EndsWith(':');

    private static List<string> YarnHeaderEntries(string line) =>
        line.TrimEnd(':').Split(',').Select(entry => entry.Trim().Trim('"')).ToList();

    private static string? YarnRegistryPackageName(string entry)
    {
        int nameEnd = entry.IndexOf('@', 1);
        if (nameEnd < 0) return null;

        string name = entry[..nameEnd];
        string range = entry[(nameEnd + 1)..];

        int protocolEnd = range.IndexOf(':');
        if (protocolEnd < 0) return name;
        if (!range[..protocolEnd].Equals("npm", StringComparison.OrdinalIgnoreCase)) return null;

        string target = range[(protocolEnd + 1)..];
        int targetNameEnd = target.IndexOf('@', 1);
        return targetNameEnd > 0 ? target[..targetNameEnd] : name;
    }

    private static string NormalizeYarnEntry(string entry)
        => entry.Replace("@npm:", "@", StringComparison.Ordinal);

    private static void ParseBunLock(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content, BunJsonOptions);

        if (!doc.RootElement.TryGetProperty("packages", out JsonElement packages)) return;

        foreach (JsonProperty package in packages.EnumerateObject())
        {
            if (!TryReadBunPackage(package.Value, out string name, out string version)) continue;
            if (!VersionText.StartsWithDigit(version)) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, name, version, DependencyEcosystem.Npm));
        }

        result.Graph = ReadBunLockGraph(packages);
    }

    private static LockGraph ReadBunLockGraph(JsonElement packages)
    {
        Dictionary<string, List<string>> edges = new(StringComparer.Ordinal);
        Dictionary<string, string> nodeByKey = IndexBunNodes(packages);

        foreach (JsonProperty package in packages.EnumerateObject())
        {
            if (!nodeByKey.TryGetValue(package.Name, out string? node)) continue;
            if (package.Value.GetArrayLength() <= BunMetadataIndex
                || package.Value[BunMetadataIndex].ValueKind != JsonValueKind.Object) continue;

            edges[node] = BunChildren(package.Name, package.Value[BunMetadataIndex], nodeByKey);
        }

        return new LockGraph(edges);
    }

    private static Dictionary<string, string> IndexBunNodes(JsonElement packages)
    {
        Dictionary<string, string> nodeByKey = new(StringComparer.Ordinal);

        foreach (JsonProperty package in packages.EnumerateObject())
        {
            if (!TryReadBunPackage(package.Value, out string name, out string version)) continue;

            nodeByKey[package.Name] = LockGraph.NodeId(name, version);
        }

        return nodeByKey;
    }

    private static List<string> BunChildren(string packageKey, JsonElement metadata,
        Dictionary<string, string> nodeByKey)
    {
        List<string> children = new();

        foreach (string section in new[] { "dependencies", "optionalDependencies" })
        {
            if (!metadata.TryGetProperty(section, out JsonElement dependencies)
                || dependencies.ValueKind != JsonValueKind.Object) continue;

            foreach (JsonProperty dependency in dependencies.EnumerateObject())
            {
                string? child = nodeByKey.GetValueOrDefault($"{packageKey}/{dependency.Name}")
                    ?? nodeByKey.GetValueOrDefault(dependency.Name);

                if (child != null) children.Add(child);
            }
        }

        return children;
    }

    private static bool TryReadBunPackage(JsonElement entry, out string name, out string version)
    {
        name = version = string.Empty;
        if (entry.ValueKind != JsonValueKind.Array || entry.GetArrayLength() == 0) return false;

        string identifier = entry[0].GetString() ?? "";
        int at = identifier.LastIndexOf('@');
        if (at <= 0) return false;

        name = identifier[..at];
        version = identifier[(at + 1)..];
        return true;
    }

    [GeneratedRegex(@"^version:?\s+[""']?([^""'\s]+)[""']?$")]
    private static partial Regex YarnVersionRegex();

    [GeneratedRegex(@"^""?(@?[^""\s:]+)""?:?\s+""?([^""]+?)""?$")]
    private static partial Regex YarnEdgeRegex();
}
