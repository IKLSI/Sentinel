using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Common;
using Sentinel.Application.TechHealth.ProjectBadge;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services.PublicBadge;

public class ProjectBadgeTests
{
    [Fact]
    public void Generate_ProduitUnJetonUrlSafeEtUnique()
    {
        string first = ProjectBadgeTokenGenerator.Generate();
        string second = ProjectBadgeTokenGenerator.Generate();

        first.Should().MatchRegex("^[A-Za-z0-9_-]{24}$");
        first.Should().NotBe(second);
    }

    [Fact]
    public async Task EnableAsync_ProjetSansJeton_GenereEtPersisteUnJeton()
    {
        using TestScope scope = new();
        Project project = new() { OrganizationId = scope.OrganizationId, Name = "api" };
        await scope.SeedAsync(scope.NewOrganization(), project);
        ProjectBadgeEnableService sut = new(scope.Projects, scope.CommitScopeFactory, scope.Tenant);

        Result<ProjectBadgeDto> result = await sut.ExecuteAsync(project.Id, TestContext.Current.CancellationToken);

        result.IsSuccess.Should().BeTrue();
        Project reloaded = scope.Context.Projects.Single(p => p.Id == project.Id);
        reloaded.BadgeToken.Should().Be(result.Value!.Token);
    }

    [Fact]
    public async Task EnableAsync_ProjetDejaActive_RetourneLeMemeJeton()
    {
        using TestScope scope = new();
        Project project = new() { OrganizationId = scope.OrganizationId, Name = "api", BadgeToken = "jeton-existant-0123456789" };
        await scope.SeedAsync(scope.NewOrganization(), project);
        ProjectBadgeEnableService sut = new(scope.Projects, scope.CommitScopeFactory, scope.Tenant);

        Result<ProjectBadgeDto> result = await sut.ExecuteAsync(project.Id, TestContext.Current.CancellationToken);

        result.Value!.Token.Should().Be("jeton-existant-0123456789");
    }

    [Fact]
    public async Task EnableAsync_ProjetDUneAutreOrganisation_RetourneIntrouvable()
    {
        using TestScope scope = new();
        Project foreign = new() { OrganizationId = Guid.NewGuid(), Name = "autre" };
        await scope.SeedAsync(foreign);
        ProjectBadgeEnableService sut = new(scope.Projects, scope.CommitScopeFactory, scope.Tenant);

        Result<ProjectBadgeDto> result = await sut.ExecuteAsync(foreign.Id, TestContext.Current.CancellationToken);

        result.IsSuccess.Should().BeFalse();
        result.Status.Should().Be(ResultStatus.NotFound);
    }

    [Fact]
    public async Task RenderAsync_JetonConnu_AfficheLeScoreStockeDuProjet()
    {
        using TestScope scope = new();
        Project project = new()
        {
            OrganizationId = scope.OrganizationId,
            Name = "api",
            BadgeToken = "jeton-valide-0123456789",
            HealthScore = 87,
            HealthGrade = "B"
        };
        await scope.SeedAsync(scope.NewOrganization(), project);
        ProjectBadgeRenderService sut = new(scope.Projects, new FakeSystemScope(), new MemoryCache(new MemoryCacheOptions()));

        Result<VersionedContent> result = await sut.ExecuteAsync("jeton-valide-0123456789",
            TestContext.Current.CancellationToken);

        System.Text.Encoding.UTF8.GetString(result.Value!.Content).Should().Contain("B · 87").And.Contain(">api<");
    }

    [Theory]
    [InlineData("jeton-inconnu-0123456789")]
    [InlineData("court")]
    [InlineData("jeton/avec/slash-0123456789")]
    public async Task RenderAsync_JetonInconnuOuInvalide_AfficheInconnu(string token)
    {
        using TestScope scope = new();
        ProjectBadgeRenderService sut = new(scope.Projects, new FakeSystemScope(), new MemoryCache(new MemoryCacheOptions()));

        Result<VersionedContent> result = await sut.ExecuteAsync(token, TestContext.Current.CancellationToken);

        System.Text.Encoding.UTF8.GetString(result.Value!.Content).Should().Contain("inconnu");
    }

    [Fact]
    public async Task RenderAsync_ProjetJamaisScanne_AfficheInconnu()
    {
        using TestScope scope = new();
        Project project = new()
        {
            OrganizationId = scope.OrganizationId,
            Name = "api",
            BadgeToken = "jeton-sans-score-0123456789"
        };
        await scope.SeedAsync(scope.NewOrganization(), project);
        ProjectBadgeRenderService sut = new(scope.Projects, new FakeSystemScope(), new MemoryCache(new MemoryCacheOptions()));

        Result<VersionedContent> result = await sut.ExecuteAsync("jeton-sans-score-0123456789",
            TestContext.Current.CancellationToken);

        System.Text.Encoding.UTF8.GetString(result.Value!.Content).Should().Contain("inconnu");
    }
}
