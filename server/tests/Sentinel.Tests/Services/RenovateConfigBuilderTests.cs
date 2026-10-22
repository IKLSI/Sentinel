using System.Text.Json.Nodes;
using FluentAssertions;
using Sentinel.Application.TechHealth.Remediation;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;

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
        target["branchTopic"]!.GetValue<string>().Should().Be("fix-lodash-4.17.21");
        config["branchPrefix"]!.GetValue<string>().Should().Be("sentinel/");
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
            NewRemediation(DependencyEcosystem.NuGet, "Newtonsoft.Json", "13.0.1"), project, Location(), Access);

        Strings(config["baseBranchPatterns"]).Should().Equal("develop");
        Strings(config["includePaths"]).Should().Equal("services/api/**");
    }

    private static JsonObject Build(DependencyEcosystem ecosystem, string packageName, string targetVersion,
        RepositoryType repositoryType) =>
        RenovateConfigBuilder.Build(NewRemediation(ecosystem, packageName, targetVersion),
            NewProject(repositoryType), Location(), Access);

    private static IEnumerable<string> Strings(JsonNode? node) =>
        node!.AsArray().Select(item => item!.GetValue<string>());

    private static VulnerabilityRemediation NewRemediation(DependencyEcosystem ecosystem, string packageName,
        string targetVersion) => new()
    {
        Ecosystem = ecosystem,
        PackageName = packageName,
        TargetVersion = targetVersion
    };

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
