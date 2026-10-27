using System.Text.Json.Nodes;
using FluentAssertions;
using Sentinel.Application.Remediation;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class RenovateConfigBuilderTests
{
    private const string RepositoryUrl = "https://git.example.com/group/sub/app";

    private static readonly RepositoryAccess Access =
        new("glpat-secret", new GitLabInstance("https://git.example.com"));

    [Fact]
    public void Build_GitLabProject_TargetsOrganizationInstance()
    {
        JsonObject config = Build(DependencyEcosystem.Npm, "lodash", "4.17.21", RepositoryType.GitLab);

        config["platform"]!.GetValue<string>().Should().Be("gitlab");
        config["endpoint"]!.GetValue<string>().Should().Be("https://git.example.com/api/v4/");
        config["token"]!.GetValue<string>().Should().Be("glpat-secret");
        Strings(config["repositories"]).Should().Equal("group/sub/app");
        config["requireConfig"]!.GetValue<string>().Should().Be("ignored");
        config["onboarding"]!.GetValue<bool>().Should().BeFalse();
    }

    [Fact]
    public void Build_GitHubProject_UsesPublicApiEndpoint()
    {
        JsonObject config = Build(DependencyEcosystem.Npm, "lodash", "4.17.21", RepositoryType.GitHub);

        config["platform"]!.GetValue<string>().Should().Be("github");
        config["endpoint"]!.GetValue<string>().Should().Be("https://api.github.com/");
    }

    [Fact]
    public void Build_RestrictsUpdatesToTheVulnerablePackageAndFixedVersion()
    {
        JsonObject config = Build(DependencyEcosystem.Npm, "lodash", "4.17.21", RepositoryType.GitLab);

        JsonArray rules = config["packageRules"]!.AsArray();
        rules[0]!["enabled"]!.GetValue<bool>().Should().BeFalse();

        JsonNode target = rules[1]!;
        Strings(target["matchPackageNames"]).Should().Equal("lodash");
        target["allowedVersions"]!.GetValue<string>().Should().Be(@"/^v?4\.17\.21$/");
        config["branchPrefix"]!.GetValue<string>().Should().Be("sentinel/");
    }

    [Fact]
    public void Build_SeveralTargets_GroupsThemIntoASingleBranch()
    {
        JsonObject config = RenovateConfigBuilder.Build(
            [
                Target(DependencyEcosystem.Npm, "axios", "1.7.4"),
                Target(DependencyEcosystem.Npm, "lodash", "4.17.21")
            ],
            NewProject(RepositoryType.GitLab), Location(), Access);

        JsonNode[] targetRules = config["packageRules"]!.AsArray().Skip(1).Select(rule => rule!).ToArray();

        targetRules.Should().HaveCount(2);
        targetRules.Should().AllSatisfy(rule =>
        {
            rule["groupName"]!.GetValue<string>().Should().Be(RemediationRules.GroupName);
            rule["groupSlug"]!.GetValue<string>().Should().Be("fix-vulnerabilities");
            rule["separateMajorMinor"]!.GetValue<bool>().Should().BeFalse();
        });
        (config["branchPrefix"]!.GetValue<string>() + targetRules[0]["groupSlug"]!.GetValue<string>())
            .Should().Be(RemediationRules.BranchName);
    }

    [Fact]
    public void Build_PyPiPackage_MatchesNormalizedNameVariants()
    {
        JsonObject config = Build(DependencyEcosystem.PyPI, "python-multipart", "0.0.18", RepositoryType.GitLab);

        Strings(config["packageRules"]![1]!["matchPackageNames"]).Should().Equal("/^python[-_.]+multipart$/i");
    }

    [Fact]
    public void Build_ProjectWithBranchAndRootPath_ScopesTheRun()
    {
        Project project = NewProject(RepositoryType.GitLab);
        project.Branch = "develop";
        project.RootPath = "/services/api/";

        JsonObject config = RenovateConfigBuilder.Build(
            [Target(DependencyEcosystem.NuGet, "Newtonsoft.Json", "13.0.1")], project, Location(),
            Access);

        Strings(config["baseBranchPatterns"]).Should().Equal("develop");
        Strings(config["includePaths"]).Should().Equal("services/api/**");
    }

    [Fact]
    public void Build_EnablesOnlyTheManagersOfTheTargetedEcosystems()
    {
        JsonObject config = RenovateConfigBuilder.Build(
            [
                Target(DependencyEcosystem.Npm, "lodash", "4.17.21"),
                Target(DependencyEcosystem.GitHubActions, "actions/checkout", "4.2.2")
            ],
            NewProject(RepositoryType.GitLab), Location(), Access);

        Strings(config["enabledManagers"]).Should().Equal("bun", "github-actions", "npm");
        Strings(config["packageRules"]![1]!["matchManagers"]).Should().Equal("npm", "bun");
    }

    [Fact]
    public void Build_ManifestsInSubdirectories_ScopesTheRunToTheirDirectories()
    {
        JsonObject config = RenovateConfigBuilder.Build(
            [
                Target(DependencyEcosystem.Npm, "lodash", "4.17.21", "apps/web/package-lock.json"),
                Target(DependencyEcosystem.Npm, "axios", "1.7.4", "apps/web/admin/package.json"),
                Target(DependencyEcosystem.PyPI, "django", "4.2.17", "services/api/requirements.txt")
            ],
            NewProject(RepositoryType.GitLab), Location(), Access);

        Strings(config["includePaths"]).Should().Equal("apps/web/**", "services/api/**");
    }

    [Fact]
    public void Build_ManifestAtRepositoryRoot_KeepsTheProjectScope()
    {
        Project project = NewProject(RepositoryType.GitLab);

        JsonObject config = RenovateConfigBuilder.Build(
            [
                Target(DependencyEcosystem.Npm, "lodash", "4.17.21", "package-lock.json"),
                Target(DependencyEcosystem.Npm, "axios", "1.7.4", "apps/web/package.json")
            ],
            project, Location(), Access);

        config.ContainsKey("includePaths").Should().BeFalse();
    }

    [Fact]
    public void Build_MavenTarget_KeepsTheProjectScopeForParentPoms()
    {
        Project project = NewProject(RepositoryType.GitLab);
        project.RootPath = "backend";

        JsonObject config = RenovateConfigBuilder.Build(
            [Target(DependencyEcosystem.Maven, "org.apache.logging.log4j:log4j-core", "2.17.1", "backend/core/pom.xml")],
            project, Location(), Access);

        Strings(config["includePaths"]).Should().Equal("backend/**");
    }

    [Fact]
    public void Build_DescribesFixedAdvisoriesAndMajorUpgradesInTheMergeRequest()
    {
        JsonObject config = RenovateConfigBuilder.Build(
            [
                Target(DependencyEcosystem.Npm, "axios", "1.7.4") with
                {
                    Advisories =
                    [
                        new RemediationAdvisory("CVE-2024-39338", VulnerabilitySeverity.High),
                        new RemediationAdvisory("CVE-2023-45857", VulnerabilitySeverity.Medium)
                    ]
                },
                Target(DependencyEcosystem.Npm, "lodash", "5.0.0") with { IsMajorUpgrade = true }
            ],
            NewProject(RepositoryType.GitLab), Location(), Access);

        string header = config["prHeader"]!.GetValue<string>();

        header.Should().StartWith("Sentinel fixes 3 vulnerabilities across 2 direct dependencies.");
        header.Should().Contain("| `axios` | 1.0.0 → 1.7.4 | CVE-2024-39338 (High), CVE-2023-45857 (Medium) |");
        header.Should().Contain("| `lodash` | 1.0.0 → 5.0.0 ⚠️ major |");
        header.Should().Contain("breaking changes");
        config["packageRules"]![1]!["commitMessageAction"]!.GetValue<string>().Should().Be("Fix");
    }

    private static RemediationTarget Target(DependencyEcosystem ecosystem, string packageName,
        string targetVersion, string? manifestPath = null) =>
        new(ecosystem, packageName, targetVersion, ["1.0.0"],
            [new RemediationAdvisory("CVE-1", VulnerabilitySeverity.High)], [manifestPath], false);

    private static JsonObject Build(DependencyEcosystem ecosystem, string packageName, string targetVersion,
        RepositoryType repositoryType) =>
        RenovateConfigBuilder.Build([Target(ecosystem, packageName, targetVersion)],
            NewProject(repositoryType), Location(), Access);

    private static IEnumerable<string> Strings(JsonNode? node) =>
        node!.AsArray().Select(item => item!.GetValue<string>());

    private static Project NewProject(RepositoryType repositoryType) => new()
    {
        RepositoryType = repositoryType,
        RepositoryUrl = RepositoryUrl
    };

    private static RepositoryLocation Location()
    {
        RepositoryLocation.TryParse(RepositoryUrl, out RepositoryLocation location);
        return location;
    }
}
