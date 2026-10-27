using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Projects;
using Sentinel.Application.Projects.Create;
using Sentinel.Application.Projects.Import;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class ProjectImportServiceTests
{
    [Fact]
    public async Task ExecuteAsync_ValidBatch_CreatesEveryProjectInOneCommit()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization());

        Result<List<ProjectDto>> result = await NewService(scope).ExecuteAsync(new ImportProjectsDto
        {
            Projects = [Repository("api"), Repository("web")]
        }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Select(project => project.Name).Should().Equal("api", "web");
        scope.Context.Projects.Count().Should().Be(2);
    }

    [Fact]
    public async Task ExecuteAsync_OneInvalidProject_CreatesNothing()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization());

        Result<List<ProjectDto>> result = await NewService(scope).ExecuteAsync(new ImportProjectsDto
        {
            Projects = [Repository("api"), Repository("")]
        }, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        scope.Context.Projects.Count().Should().Be(0);
    }

    [Fact]
    public async Task ExecuteAsync_EmptyBatch_IsRejected()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization());

        Result<List<ProjectDto>> result =
            await NewService(scope).ExecuteAsync(new ImportProjectsDto(), CancellationToken.None);

        result.Status.Should().Be(ResultStatus.Invalid);
    }

    private static CreateProjectDto Repository(string name) => new()
    {
        Name = name,
        RepositoryUrl = $"https://github.com/acme/{(name.Length > 0 ? name : "x")}"
    };

    private static ProjectImportService NewService(TestScope scope) => new(
        scope.Projects,
        scope.Organizations,
        scope.CommitScopeFactory,
        new FakeAuditLogService(),
        new NoopRealtimeNotifier(),
        scope.Tenant,
        new ProjectImportValidator(new ProjectCreateValidator()));
}
