using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Users.Options;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class UserOptionListServiceTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsEveryMemberSortedByName_WithEmailWhenNameIsMissing()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization(),
            NewUser(scope, "Zoé", "Martin", "zoe@test.fr"),
            NewUser(scope, "", "", "anonyme@test.fr"),
            NewUser(scope, "Alice", "Durand", "alice@test.fr"));

        Result<List<UserOptionDto>> result =
            await new UserOptionListService(scope.Users, scope.Tenant).ExecuteAsync(CancellationToken.None);

        result.Value!.Select(option => option.Name).Should().Equal("anonyme@test.fr", "Alice Durand", "Zoé Martin");
    }

    [Fact]
    public async Task ExecuteAsync_WhenTenantIsNotResolved_ReturnsUnauthorized()
    {
        using TestScope scope = new TestScope();
        scope.Tenant.OrganizationId = null;

        Result<List<UserOptionDto>> result =
            await new UserOptionListService(scope.Users, scope.Tenant).ExecuteAsync(CancellationToken.None);

        result.Status.Should().Be(ResultStatus.Unauthorized);
    }

    private static User NewUser(TestScope scope, string firstName, string lastName, string email) => new()
    {
        OrganizationId = scope.OrganizationId,
        Email = email,
        FirstName = firstName,
        LastName = lastName,
        PasswordHash = "hash",
        Role = UserRole.Developer,
        AccessStatus = UserAccessStatus.Active
    };
}
