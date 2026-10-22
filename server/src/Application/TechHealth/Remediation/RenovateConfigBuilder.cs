using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Remediation;

public static class RenovateConfigBuilder
{
    private const string GitHubEndpoint = "https://api.github.com/";
    private const string PyPiSeparatorPattern = "[-_.]+";

    public static JsonObject Build(VulnerabilityRemediation remediation, Project project,
        RepositoryLocation location, RepositoryAccess access)
    {
        JsonObject config = new()
        {
            ["platform"] = project.RepositoryType == RepositoryType.GitLab ? "gitlab" : "github",
            ["endpoint"] = project.RepositoryType == RepositoryType.GitLab
                ? $"{access.GitLab.ApiBaseUrl}/"
                : GitHubEndpoint,
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
            ["packageRules"] = new JsonArray(
                new JsonObject
                {
                    ["matchPackageNames"] = new JsonArray("*"),
                    ["enabled"] = false
                },
                new JsonObject
                {
                    ["matchPackageNames"] = new JsonArray(PackagePattern(remediation)),
                    ["enabled"] = true,
                    ["allowedVersions"] = $"/^v?{Regex.Escape(remediation.TargetVersion)}$/",
                    ["rangeStrategy"] = "bump",
                    ["respectLatest"] = false,
                    ["ignoreUnstable"] = false,
                    ["additionalBranchPrefix"] = string.Empty,
                    ["branchTopic"] = RemediationRules.BranchTopicFor(remediation.PackageName,
                        remediation.TargetVersion)
                })
        };

        if (!string.IsNullOrWhiteSpace(project.Branch))
            config["baseBranchPatterns"] = new JsonArray(project.Branch);

        if (!string.IsNullOrWhiteSpace(project.RootPath))
            config["includePaths"] = new JsonArray($"{project.RootPath.Trim('/')}/**");

        return config;
    }

    private static string PackagePattern(VulnerabilityRemediation remediation) =>
        remediation.Ecosystem == DependencyEcosystem.PyPI
            ? $"/^{string.Join(PyPiSeparatorPattern, Regex.Split(remediation.PackageName, PyPiSeparatorPattern).Select(Regex.Escape))}$/i"
            : remediation.PackageName;
}
