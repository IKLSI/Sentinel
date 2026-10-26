using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    public const string WorkflowFileName = "github-actions-workflow";

    private static readonly string[] WorkflowDirectoryMarkers = [".github/workflows/", ".github%2Fworkflows%2F"];

    public static bool IsWorkflowFile(string url) =>
        (url.EndsWith(".yml", StringComparison.OrdinalIgnoreCase)
            || url.EndsWith(".yaml", StringComparison.OrdinalIgnoreCase)
            || url.Contains(".yml/raw", StringComparison.OrdinalIgnoreCase)
            || url.Contains(".yaml/raw", StringComparison.OrdinalIgnoreCase))
        && WorkflowDirectoryMarkers.Any(marker => url.Contains(marker, StringComparison.OrdinalIgnoreCase));

    private static void ParseWorkflow(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match uses in WorkflowUsesRegex().Matches(content))
        {
            string action = uses.Groups["action"].Value;
            string reference = uses.Groups["ref"].Value;

            if (action.StartsWith("./", StringComparison.Ordinal)) continue;
            if (action.StartsWith("docker://", StringComparison.OrdinalIgnoreCase)) continue;

            string[] segments = action.Split('/');
            if (segments.Length < 2) continue;

            string version = reference.TrimStart('v', 'V');
            if (!VersionText.StartsWithDigit(version) || CommitShaRegex().IsMatch(reference)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = $"{segments[0]}/{segments[1]}",
                CurrentVersion = version,
                IsVersionPinned = version.Count(c => c == '.') >= 2,
                Type = DependencyType.Dev,
                Ecosystem = DependencyEcosystem.GitHubActions,
            });
        }
    }

    [GeneratedRegex(@"^\s*-?\s*uses:\s*[""']?(?<action>[^@\s""']+)@(?<ref>[^\s""'#]+)", RegexOptions.Multiline)]
    private static partial Regex WorkflowUsesRegex();

    [GeneratedRegex(@"^[0-9a-f]{40}$", RegexOptions.IgnoreCase)]
    private static partial Regex CommitShaRegex();
}
