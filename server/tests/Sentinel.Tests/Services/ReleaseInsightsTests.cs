using FluentAssertions;
using Sentinel.Application.Deployments.Compare;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Tests.Services;

public class ReleaseInsightsTests
{
    private static RepositoryChangedFile Changed(string path) => new(path, RepositoryFileChange.Modified);

    [Fact]
    public void ReleaseFileScope_WithoutDependencyChange_DoesNotNeedTheTree()
    {
        List<RepositoryChangedFile> changed =
        [
            Changed("src/Billing/Invoice.cs"),
            new("src/Api/appsettings.json", RepositoryFileChange.Modified)
        ];

        ReleaseFileScope.TouchesDependencies(changed, null).Should().BeFalse();

        ReleaseReadPlan plan = ReleaseFileScope.Targeted(changed, [], null);

        plan.BaseManifests.Should().BeEmpty();
        plan.HeadManifests.Should().BeEmpty();
        plan.BaseConfiguration.Should().Equal("src/Api/appsettings.json");
        plan.HeadConfiguration.Should().Equal("src/Api/appsettings.json");
    }

    [Fact]
    public void ReleaseFileScope_ReadsOnlyManifestsRelatedToTheChange()
    {
        List<RepositoryChangedFile> changed =
        [
            Changed("client/package.json"),
            new("server/Migrations/20261021_Drop.cs", RepositoryFileChange.Added),
            new("server/.env.example", RepositoryFileChange.Removed)
        ];
        string[] headPaths =
        [
            "client/package.json", "client/pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json",
            "server/Api/Api.csproj", "server/Migrations/20261021_Drop.cs", "client/src/App.tsx"
        ];

        ReleaseReadPlan plan = ReleaseFileScope.Targeted(changed, headPaths, null);

        plan.HeadManifests.Should().BeEquivalentTo("client/package.json", "client/pnpm-lock.yaml", "package.json");
        plan.BaseManifests.Should().BeEquivalentTo(plan.HeadManifests);
        plan.BaseConfiguration.Should().Equal("server/.env.example");
        plan.HeadConfiguration.Should().BeEmpty();
        plan.AddedMigrations.Should().Equal("server/Migrations/20261021_Drop.cs");
    }
}
