using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Common;
using Sentinel.Application.Projects.Search;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class ProjectSearchServiceTests
{
    private const string UnusedConnectionString =
        "Host=localhost;Database=sentinel_translation_check;Username=none;Password=none";

    [Fact]
    public void DependencySearchByName_SeTraduitEnSqlInsensibleALaCasse()
    {
        using SentinelContext context = new SentinelContext(
            new DbContextOptionsBuilder<SentinelContext>().UseNpgsql(UnusedConnectionString).Options,
            new FakeTenantContext(),
            new FakeSystemScope());

        string sql = new DependencyRepository(context).SearchByName(Guid.NewGuid(), "Lodash", 50).ToQueryString();

        sql.Should().Contain("lower(");
        sql.Should().Contain("LIMIT");
    }

    [Fact]
    public async Task ExecuteAsync_TrouveLesProjetsParNomOuParDependanceAvecLesLibrairiesDetectees()
    {
        using TestScope scope = new TestScope();
        Project api = NewProject(scope, "api");
        Project lodashTools = NewProject(scope, "lodash-tools");
        Project web = NewProject(scope, "web");
        api.Dependencies.Add(NewDependency(api, "lodash", "4.17.15", DependencyStatus.Vulnerable));
        api.Dependencies.Add(NewDependency(api, "lodash.merge", "4.6.2", DependencyStatus.UpToDate));
        web.Dependencies.Add(NewDependency(web, "react", "19.0.0", DependencyStatus.UpToDate));
        await scope.SeedAsync(scope.NewOrganization(), api, lodashTools, web);

        Result<List<ProjectSearchMatchDto>> result = await Search(scope, "LODASH");

        result.Value!.Select(match => match.ProjectId).Should().BeEquivalentTo([api.Id, lodashTools.Id]);
        ProjectSearchMatchDto apiMatch = result.Value!.Single(match => match.ProjectId == api.Id);
        apiMatch.DependencyMatchCount.Should().Be(2);
        apiMatch.Dependencies.Select(dependency => dependency.Name).Should().Equal("lodash", "lodash.merge");
        result.Value!.Single(match => match.ProjectId == lodashTools.Id).Dependencies.Should().BeEmpty();
    }

    [Fact]
    public async Task ExecuteAsync_NeChercheDansLesDependancesQuAPartirDeDeuxCaracteres()
    {
        using TestScope scope = new TestScope();
        Project web = NewProject(scope, "web");
        web.Dependencies.Add(NewDependency(web, "react", "19.0.0", DependencyStatus.UpToDate));
        await scope.SeedAsync(scope.NewOrganization(), web);

        Result<List<ProjectSearchMatchDto>> result = await Search(scope, "r");

        result.Value!.Should().BeEmpty();
    }

    [Fact]
    public async Task ExecuteAsync_IgnoreLesDependancesDUneAutreOrganisation()
    {
        using TestScope scope = new TestScope();
        Project foreign = new Project { OrganizationId = Guid.NewGuid(), Name = "foreign" };
        foreign.Dependencies.Add(NewDependency(foreign, "lodash", "4.17.21", DependencyStatus.UpToDate));
        await scope.SeedAsync(scope.NewOrganization(), foreign);

        Result<List<ProjectSearchMatchDto>> result = await Search(scope, "lodash");

        result.Value!.Should().BeEmpty();
    }

    [Fact]
    public async Task ExecuteAsync_QuandLaRechercheDepasseLaLimite_RetourneInvalide()
    {
        using TestScope scope = new TestScope();

        Result<List<ProjectSearchMatchDto>> result =
            await Search(scope, new string('a', ProjectSearchValidator.MaxLength + 1));

        result.Status.Should().Be(ResultStatus.Invalid);
    }

    private static Task<Result<List<ProjectSearchMatchDto>>> Search(TestScope scope, string query) =>
        new ProjectSearchService(scope.Projects, new DependencyRepository(scope.Context), scope.Tenant,
                new ProjectSearchValidator())
            .ExecuteAsync(new ProjectSearchModel { Q = query }, TestContext.Current.CancellationToken);

    private static Project NewProject(TestScope scope, string name) => new()
    {
        OrganizationId = scope.OrganizationId,
        Name = name
    };

    private static Dependency NewDependency(Project project, string name, string version,
        DependencyStatus status) => new()
    {
        ProjectId = project.Id,
        OrganizationId = project.OrganizationId,
        Name = name,
        CurrentVersion = version,
        Status = status
    };
}
