using System.Text.Json;
using System.Text.RegularExpressions;

namespace Sentinel.Application.TechHealth.Scan;

public sealed record LockGraph(Dictionary<string, List<string>> Edges)
{
    public static string NodeId(string name, string version) => $"{name}@{version}";

    public HashSet<string> ReachableFrom(IEnumerable<string> roots)
    {
        HashSet<string> visited = new(StringComparer.Ordinal);
        Stack<string> pending = new(roots);

        while (pending.Count > 0)
        {
            string node = pending.Pop();

            if (!visited.Add(node) || !Edges.TryGetValue(node, out List<string>? children)) continue;

            foreach (string child in children) pending.Push(child);
        }

        return visited;
    }
}

public partial class ManifestParserService
{
    private static readonly HashSet<string> YarnEdgeSections = new(StringComparer.Ordinal)
    {
        "dependencies:",
        "optionalDependencies:"
    };

    public static bool HasLockGraph(string fileName)
        => fileName.Equals("yarn.lock", StringComparison.OrdinalIgnoreCase)
            || fileName.Equals("bun.lock", StringComparison.OrdinalIgnoreCase);

    public LockGraph? ParseLockGraph(string fileName, string content)
    {
        try
        {
            if (fileName.Equals("yarn.lock", StringComparison.OrdinalIgnoreCase)) return ParseYarnLockGraph(content);
            if (fileName.Equals("bun.lock", StringComparison.OrdinalIgnoreCase)) return ParseBunLockGraph(content);
        }
        catch (Exception)
        {
            return null;
        }

        return null;
    }

    private static LockGraph ParseYarnLockGraph(string content)
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

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();

            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                Flush();
                continue;
            }

            if (!line.StartsWith(' ') && line.EndsWith(':'))
            {
                Flush();
                currentEntries = line.TrimEnd(':').Split(',')
                    .Select(entry => entry.Trim().Trim('"'))
                    .ToList();
                continue;
            }

            string trimmed = line.Trim();
            int indent = line.Length - line.TrimStart().Length;

            if (indent == 2)
            {
                inEdgeSection = YarnEdgeSections.Contains(trimmed);

                Match version = YarnLockVersionRegex().Match(trimmed);
                string? name = currentEntries.Count > 0 ? YarnRegistryPackageName(currentEntries[0]) : null;

                if (version.Success && name != null)
                {
                    currentNode = LockGraph.NodeId(name, version.Groups[1].Value);

                    foreach (string entry in currentEntries) nodeByEntry[NormalizeYarnEntry(entry)] = currentNode;
                }

                continue;
            }

            if (indent == 4 && inEdgeSection && YarnEdgeRegex().Match(trimmed) is { Success: true } edge)
                currentChildren.Add(NormalizeYarnEntry($"{edge.Groups[1].Value}@{edge.Groups[2].Value}"));
        }

        Flush();

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

        return new LockGraph(edges);
    }

    private static string NormalizeYarnEntry(string entry)
        => entry.Replace("@npm:", "@", StringComparison.Ordinal);

    private static LockGraph ParseBunLockGraph(string content)
    {
        using JsonDocument doc = JsonDocument.Parse(content, new JsonDocumentOptions
        {
            AllowTrailingCommas = true,
            CommentHandling = JsonCommentHandling.Skip
        });

        Dictionary<string, List<string>> edges = new(StringComparer.Ordinal);

        if (!doc.RootElement.TryGetProperty("packages", out JsonElement packages)) return new LockGraph(edges);

        Dictionary<string, string> nodeByKey = new(StringComparer.Ordinal);

        foreach (JsonProperty package in packages.EnumerateObject())
        {
            if (package.Value.ValueKind != JsonValueKind.Array || package.Value.GetArrayLength() == 0) continue;

            string identifier = package.Value[0].GetString() ?? "";
            int at = identifier.LastIndexOf('@');
            if (at <= 0) continue;

            nodeByKey[package.Name] = LockGraph.NodeId(identifier[..at], identifier[(at + 1)..]);
        }

        foreach (JsonProperty package in packages.EnumerateObject())
        {
            if (!nodeByKey.TryGetValue(package.Name, out string? node)) continue;
            if (package.Value.GetArrayLength() < 3 || package.Value[2].ValueKind != JsonValueKind.Object) continue;

            List<string> children = new();

            foreach (string section in new[] { "dependencies", "optionalDependencies" })
            {
                if (!package.Value[2].TryGetProperty(section, out JsonElement dependencies)
                    || dependencies.ValueKind != JsonValueKind.Object) continue;

                foreach (JsonProperty dependency in dependencies.EnumerateObject())
                {
                    string? child = nodeByKey.GetValueOrDefault($"{package.Name}/{dependency.Name}")
                        ?? nodeByKey.GetValueOrDefault(dependency.Name);

                    if (child != null) children.Add(child);
                }
            }

            edges[node] = children;
        }

        return new LockGraph(edges);
    }

    [GeneratedRegex(@"^""?(@?[^""\s:]+)""?:?\s+""?([^""]+?)""?$")]
    private static partial Regex YarnEdgeRegex();
}
