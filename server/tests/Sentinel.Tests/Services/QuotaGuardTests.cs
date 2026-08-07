using FluentAssertions;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class QuotaGuardTests
{
    [Fact]
    public async Task EnsureCanAddProjectAsync_WhenUnderPlanLimit_ReturnsSuccess()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization(PlanTier.Free));

        QuotaGuard sut = BuildGuard(scope);

        Result result = await sut.EnsureCanAddProjectAsync(scope.OrganizationId, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task EnsureCanAddProjectAsync_WhenPlanLimitReached_ReturnsPaymentRequired()
    {
        using TestScope scope = new TestScope();
        PlanLimits limits = PlanLimits.For(PlanTier.Free);

        await scope.SeedAsync(scope.NewOrganization(PlanTier.Free));

        for (int index = 0; index < limits.MaxProjects; index++)
            await scope.SeedAsync(NewProject(scope.OrganizationId, $"Projet {index}"));

        QuotaGuard sut = BuildGuard(scope);

        Result result = await sut.EnsureCanAddProjectAsync(scope.OrganizationId, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Status.Should().Be(ResultStatus.PaymentRequired);
        result.Code.Should().Be(ErrorCodes.QuotaProjectsExceeded);
        result.Params!["limit"].Should().Be(limits.MaxProjects.ToString());
    }

    [Fact]
    public async Task EnsureCanInviteMemberAsync_WhenMemberLimitReached_ReturnsPaymentRequired()
    {
        using TestScope scope = new TestScope();
        PlanLimits limits = PlanLimits.For(PlanTier.Free);

        await scope.SeedAsync(scope.NewOrganization(PlanTier.Free));

        for (int index = 0; index < limits.MaxMembers; index++)
            await scope.SeedAsync(NewUser(scope.OrganizationId, $"membre{index}@test.fr"));

        QuotaGuard sut = BuildGuard(scope);

        Result result = await sut.EnsureCanInviteMemberAsync(scope.OrganizationId, CancellationToken.None);

        result.Status.Should().Be(ResultStatus.PaymentRequired);
        result.Code.Should().Be(ErrorCodes.QuotaMembersExceeded);
    }

    [Fact]
    public async Task EnsureComplianceExportsAllowedAsync_EnPlanFree_ReturnsPaymentRequired()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization(PlanTier.Free));

        QuotaGuard sut = BuildGuard(scope);

        Result result = await sut.EnsureComplianceExportsAllowedAsync(scope.OrganizationId, CancellationToken.None);

        result.Status.Should().Be(ResultStatus.PaymentRequired);
        result.Code.Should().Be(ErrorCodes.ComplianceExportsAbovePlan);
    }

    [Theory]
    [InlineData(PlanTier.Pro)]
    [InlineData(PlanTier.Business)]
    public async Task EnsureComplianceExportsAllowedAsync_EnPlanPayant_ReturnsSuccess(PlanTier tier)
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(scope.NewOrganization(tier));

        QuotaGuard sut = BuildGuard(scope);

        Result result = await sut.EnsureComplianceExportsAllowedAsync(scope.OrganizationId, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    private static QuotaGuard BuildGuard(TestScope scope) => new(
        scope.Organizations,
        scope.Projects,
        scope.Users,
        scope.Invitations,
        new FakeSystemScope());

    private static Project NewProject(Guid organizationId, string name) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = organizationId,
        Name = name,
        RepositoryType = RepositoryType.GitHub,
        ScanFrequency = ScanFrequency.Weekly
    };

    private static User NewUser(Guid organizationId, string email) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = organizationId,
        Email = email,
        FirstName = "Membre",
        LastName = "Test",
        PasswordHash = "hash",
        Role = UserRole.Developer,
        AccessStatus = UserAccessStatus.Active
    };
}
