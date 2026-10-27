using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Projects.Options;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class ProjectOptionListServiceTests
{
    [Fact]
    public async Task ExecuteAsync_RetourneLesProjetsDeLOrganisationTriesParNom()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization(),
            new Project { OrganizationId = scope.OrganizationId, Name = "Zeta" },
            new Project { OrganizationId = scope.OrganizationId, Name = "Alpha" },
            new Project { OrganizationId = Guid.NewGuid(), Name = "Autre organisation" });

        Result<List<ProjectOptionDto>> result = await new ProjectOptionListService(scope.Projects, scope.Tenant)
            .ExecuteAsync(TestContext.Current.CancellationToken);

        result.Value!.Select(option => option.Name).Should().Equal("Alpha", "Zeta");
    }

    [Fact]
    public async Task ExecuteAsync_SansOrganisation_RetourneNonAutorise()
    {
        using TestScope scope = new TestScope();
        scope.Tenant.OrganizationId = null;

        Result<List<ProjectOptionDto>> result = await new ProjectOptionListService(scope.Projects, scope.Tenant)
            .ExecuteAsync(TestContext.Current.CancellationToken);

        result.IsSuccess.Should().BeFalse();
    }
}
