using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class GitHubWorkflowParser : IManifestFileParser
{
    public const string FileName = "github-actions-workflow";

    private static readonly string[] WorkflowDirectoryMarkers = [".github/workflows/", ".github%2Fworkflows%2F"];

    public static bool IsWorkflowFile(string url) =>
        (url.EndsWith(".yml", StringComparison.OrdinalIgnoreCase)
            || url.EndsWith(".yaml", StringComparison.OrdinalIgnoreCase)
            || url.Contains(".yml/raw", StringComparison.OrdinalIgnoreCase)
            || url.Contains(".yaml/raw", StringComparison.OrdinalIgnoreCase))
        && WorkflowDirectoryMarkers.Any(marker => url.Contains(marker, StringComparison.OrdinalIgnoreCase));

    public bool CanParse(string fileName) => fileName == FileName;

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (Match uses in UsesRegex().Matches(manifest.Content))
        {
            string action = uses.Groups["action"].Value;
            string reference = uses.Groups["ref"].Value;

            if (action.StartsWith("./", StringComparison.Ordinal)) continue;
            if (action.StartsWith("docker://", StringComparison.OrdinalIgnoreCase)) continue;

            string[] segments = action.Split('/');
            if (segments.Length < 2) continue;

            string version = reference.TrimStart('v', 'V');
            if (!VersionText.StartsWithDigit(version) || CommitShaRegex().IsMatch(reference)) continue;

            result.Dependencies.Add(new Dependency
            {
                ProjectId = manifest.ProjectId,
                Name = $"{segments[0]}/{segments[1]}",
                CurrentVersion = version,
                IsVersionPinned = version.Count(c => c == '.') >= 2,
                Type = DependencyType.Dev,
                Ecosystem = DependencyEcosystem.GitHubActions,
            });
        }
    }

    [GeneratedRegex(@"^\s*-?\s*uses:\s*[""']?(?<action>[^@\s""']+)@(?<ref>[^\s""'#]+)", RegexOptions.Multiline)]
    private static partial Regex UsesRegex();

    [GeneratedRegex(@"^[0-9a-f]{40}$", RegexOptions.IgnoreCase)]
    private static partial Regex CommitShaRegex();
}
