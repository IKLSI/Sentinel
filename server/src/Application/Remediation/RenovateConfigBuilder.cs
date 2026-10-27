using System.Text;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Remediation;

public static class RenovateConfigBuilder
{
    private const string GitHubEndpoint = "https://api.github.com/";
    private const string PyPiSeparatorPattern = "[-_.]+";
    private const string CommitMessageAction = "Fix";
    private const string AnyPath = "**";

    private static readonly IReadOnlyDictionary<DependencyEcosystem, string[]> ManagersByEcosystem =
        new Dictionary<DependencyEcosystem, string[]>
        {
            [DependencyEcosystem.Npm] = ["npm", "bun"],
            [DependencyEcosystem.PyPI] =
                ["pip_requirements", "pip_setup", "pip-compile", "pipenv", "poetry", "pep621", "setup-cfg"],
            [DependencyEcosystem.Composer] = ["composer"],
            [DependencyEcosystem.Gem] = ["bundler"],
            [DependencyEcosystem.Maven] = ["maven", "gradle"],
            [DependencyEcosystem.NuGet] = ["nuget"],
            [DependencyEcosystem.Go] = ["gomod"],
            [DependencyEcosystem.Cargo] = ["cargo"],
            [DependencyEcosystem.Hex] = ["mix"],
            [DependencyEcosystem.Pub] = ["pub"],
            [DependencyEcosystem.Swift] = ["swift"],
            [DependencyEcosystem.CocoaPods] = ["cocoapods"],
            [DependencyEcosystem.GitHubActions] = ["github-actions"]
        };

    private static readonly HashSet<DependencyEcosystem> EcosystemsResolvedOutsideManifestDirectory =
        [DependencyEcosystem.Maven];

    public static JsonObject Build(IReadOnlyList<RemediationTarget> targets, Project project,
        RepositoryLocation location, RepositoryAccess access)
    {
        JsonArray packageRules = new(new JsonObject
        {
            ["matchPackageNames"] = new JsonArray("*"),
            ["enabled"] = false
        });

        foreach (RemediationTarget target in targets)
            packageRules.Add(TargetRule(target));

        bool isGitLab = project.RepositoryType == RepositoryType.GitLab;

        JsonObject config = new()
        {
            ["platform"] = isGitLab ? "gitlab" : "github",
            ["endpoint"] = isGitLab ? $"{access.GitLab.ApiBaseUrl}/" : GitHubEndpoint,
            ["token"] = access.Token,
            ["repositories"] = new JsonArray($"{location.Owner}/{location.Repository}"),
            ["onboarding"] = false,
            ["requireConfig"] = "ignored",
            ["dependencyDashboard"] = false,
            ["prHourlyLimit"] = 0,
            ["prConcurrentLimit"] = 0,
            ["branchConcurrentLimit"] = 0,
            ["branchPrefix"] = RemediationRules.BranchPrefix,
            ["lockFileMaintenance"] = new JsonObject { ["enabled"] = false },
            ["vulnerabilityAlerts"] = new JsonObject { ["enabled"] = false },
            ["osvVulnerabilityAlerts"] = false,
            ["enabledManagers"] = ToJsonArray(targets
                .SelectMany(target => ManagersByEcosystem[target.Ecosystem])
                .Distinct()
                .Order(StringComparer.Ordinal)),
            ["prHeader"] = PrHeader(targets),
            ["packageRules"] = packageRules
        };

        if (!string.IsNullOrWhiteSpace(project.Branch))
            config["baseBranchPatterns"] = new JsonArray(project.Branch);

        IReadOnlyList<string> includePaths = IncludePathsFor(targets, project.RootPath);

        if (includePaths.Count > 0)
            config["includePaths"] = ToJsonArray(includePaths);

        return config;
    }

    private static IReadOnlyList<string> IncludePathsFor(IReadOnlyList<RemediationTarget> targets, string? rootPath)
    {
        string? normalizedRootPath = RepositoryScanPaths.NormalizeRootPath(rootPath);
        IReadOnlyList<string> projectScope = normalizedRootPath == null ? [] : [$"{normalizedRootPath}/{AnyPath}"];

        if (targets.Any(target => EcosystemsResolvedOutsideManifestDirectory.Contains(target.Ecosystem)
                || target.ManifestPaths.Any(path => string.IsNullOrWhiteSpace(path))))
            return projectScope;

        List<string> directories = targets
            .SelectMany(target => target.ManifestPaths)
            .Select(path => RepositoryScanPaths.DirectoryOf(path!))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (directories.Contains(string.Empty))
            return projectScope;

        return directories
            .Where(directory => !directories.Any(other => other != directory
                && directory.StartsWith($"{other}/", StringComparison.Ordinal)))
            .Select(directory => $"{directory}/{AnyPath}")
            .Order(StringComparer.Ordinal)
            .ToList();
    }

    private static string PrHeader(IReadOnlyList<RemediationTarget> targets)
    {
        StringBuilder header = new();
        int advisories = targets.Sum(target => target.Advisories.Count);

        header.AppendLine($"Sentinel fixes {advisories} {Plural(advisories, "vulnerability", "vulnerabilities")} "
            + $"across {targets.Count} direct {Plural(targets.Count, "dependency", "dependencies")}.");
        header.AppendLine();
        header.AppendLine("| Package | Update | Advisories |");
        header.AppendLine("|---|---|---|");

        foreach (RemediationTarget target in targets)
        {
            string update = $"{string.Join(", ", target.CurrentVersions)} → {target.TargetVersion}"
                + (target.IsMajorUpgrade ? " ⚠️ major" : string.Empty);
            string advisoryList = string.Join(", ",
                target.Advisories.Select(advisory => $"{advisory.CveId} ({advisory.Severity})"));

            header.AppendLine($"| `{target.PackageName}` | {update} | {advisoryList} |");
        }

        if (targets.Any(target => target.IsMajorUpgrade))
        {
            header.AppendLine();
            header.AppendLine("> ⚠️ Major upgrades may contain breaking changes: review them before merging.");
        }

        return header.ToString().TrimEnd();
    }

    private static string Plural(int count, string singular, string plural) => count > 1 ? plural : singular;

    private static JsonArray ToJsonArray(IEnumerable<string> values) =>
        new(values.Select(value => (JsonNode?)JsonValue.Create(value)).ToArray());

    private static JsonObject TargetRule(RemediationTarget target) => new()
    {
        ["matchManagers"] = ToJsonArray(ManagersByEcosystem[target.Ecosystem]),
        ["matchPackageNames"] = new JsonArray(PackagePattern(target)),
        ["enabled"] = true,
        ["allowedVersions"] = $"/^v?{Regex.Escape(target.TargetVersion)}$/",
        ["rangeStrategy"] = "bump",
        ["respectLatest"] = false,
        ["ignoreUnstable"] = false,
        ["separateMajorMinor"] = false,
        ["additionalBranchPrefix"] = string.Empty,
        ["groupName"] = RemediationRules.GroupName,
        ["groupSlug"] = RemediationRules.GroupSlug,
        ["commitMessageAction"] = CommitMessageAction
    };

    private static string PackagePattern(RemediationTarget target) =>
        target.Ecosystem == DependencyEcosystem.PyPI
            ? $"/^{string.Join(PyPiSeparatorPattern, Regex.Split(target.PackageName, PyPiSeparatorPattern).Select(Regex.Escape))}$/i"
            : target.PackageName;
}
