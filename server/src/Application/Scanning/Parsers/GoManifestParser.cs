using Sentinel.Domain.Entities;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed class GoManifestParser : IManifestFileParser
{
    public bool CanParse(string fileName) => fileName.Equals("go.mod", StringComparison.OrdinalIgnoreCase);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        bool inRequireBlock = false;

        foreach (string raw in manifest.Content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            string line = raw.Trim();

            if (line.StartsWith("go ") && !inRequireBlock)
            {
                result.Runtimes.Add(NewRuntime(manifest.ProjectId, "Go", line[3..].Trim()));
                continue;
            }

            if (line.StartsWith("require (") || line == "require(") { inRequireBlock = true; continue; }
            if (line == ")") { inRequireBlock = false; continue; }

            string? requirement = RequirementText(line, inRequireBlock);
            if (requirement == null) continue;

            string[] parts = requirement.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) continue;

            result.Dependencies.Add(new Dependency
            {
                ProjectId = manifest.ProjectId,
                Name = parts[0],
                CurrentVersion = parts[1].TrimStart('v'),
                IsDirect = !line.Contains("// indirect"),
                Ecosystem = DependencyEcosystem.Go,
            });
        }
    }

    private static string? RequirementText(string line, bool inRequireBlock)
    {
        if (inRequireBlock) return line.StartsWith("//") ? null : line;

        return line.StartsWith("require ") && !line.Contains('(') ? line[8..].Trim() : null;
    }
}
