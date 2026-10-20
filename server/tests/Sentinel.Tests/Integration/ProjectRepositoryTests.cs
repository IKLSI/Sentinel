using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class ProjectRepositoryTests
{
    private readonly PostgresFixture _fixture;

    public ProjectRepositoryTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task ListScoringGraphsByIdsAsync_ChargeLeGrapheUtileSansLesTextesLourds()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        Project project = scope.NewProject();
        Dependency dependency = scope.NewDependency(project.Id);
        dependency.License = "MIT";
        Vulnerability vulnerability = scope.NewVulnerability(dependency.Id);
        vulnerability.Severity = VulnerabilitySeverity.Critical;
        vulnerability.FixedVersion = "1.0.1";

        await scope.SeedAsync(scope.NewOrganization(), project, dependency, vulnerability);

        IReadOnlyList<Project> graphs = await scope.Projects.ListScoringGraphsByIdsAsync(scope.OrganizationId,
            [project.Id], TestContext.Current.CancellationToken);

        Dependency loaded = graphs.Should().ContainSingle().Subject.Dependencies.Should().ContainSingle().Subject;
        Vulnerability loadedVulnerability = loaded.Vulnerabilities.Should().ContainSingle().Subject;

        loadedVulnerability.Severity.Should().Be(VulnerabilitySeverity.Critical);
        loadedVulnerability.FixedVersion.Should().Be("1.0.1");
        loadedVulnerability.Description.Should().BeEmpty();
        loaded.License.Should().BeNull();
    }
}
