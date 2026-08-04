using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Data;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Data;

public class TenantQueryFilterTests
{
    [Fact]
    public async Task Query_WhenTenantIsUnresolved_ReturnsNothing()
    {
        string databaseName = Guid.NewGuid().ToString();
        Guid organizationId = Guid.NewGuid();

        using (SentinelContext seedContext = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext { OrganizationId = organizationId }, databaseName))
        {
            seedContext.AddRange(NewOrganization(organizationId), NewUser(organizationId));
            await seedContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using SentinelContext unresolvedContext = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext(), databaseName);

        (await unresolvedContext.Users.CountAsync(TestContext.Current.CancellationToken)).Should().Be(0);
        (await unresolvedContext.Organizations.CountAsync(TestContext.Current.CancellationToken)).Should().Be(0);
    }

    [Fact]
    public async Task Query_WhenTenantContextIsMissing_ReturnsNothing()
    {
        string databaseName = Guid.NewGuid().ToString();
        Guid organizationId = Guid.NewGuid();
        SystemScope systemScope = new SystemScope();

        using (SentinelContext seedContext = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext { OrganizationId = organizationId }, systemScope, databaseName))
        using (systemScope.Enter())
        {
            seedContext.AddRange(NewOrganization(organizationId), NewUser(organizationId));
            await seedContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using SentinelContext contextWithoutTenant = TestDbContextFactory.CreateInMemory(databaseName);

        (await contextWithoutTenant.Users.CountAsync(TestContext.Current.CancellationToken)).Should().Be(0);
        (await contextWithoutTenant.Organizations.CountAsync(TestContext.Current.CancellationToken)).Should().Be(0);
    }

    [Fact]
    public async Task PasswordResetTokens_OfAnotherOrganization_AreNotReadable()
    {
        string databaseName = Guid.NewGuid().ToString();
        Guid organizationId = Guid.NewGuid();
        Guid foreignOrganizationId = Guid.NewGuid();
        SystemScope systemScope = new SystemScope();

        User localUser = NewUser(organizationId);
        User foreignUser = NewUser(foreignOrganizationId);

        using (SentinelContext seedContext = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext { OrganizationId = organizationId }, systemScope, databaseName))
        using (systemScope.Enter())
        {
            seedContext.AddRange(
                NewOrganization(organizationId),
                NewOrganization(foreignOrganizationId),
                localUser,
                foreignUser,
                NewPasswordResetToken(localUser),
                NewPasswordResetToken(foreignUser));
            await seedContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using SentinelContext tenantContext = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext { OrganizationId = organizationId }, databaseName);

        List<PasswordResetToken> visible = await tenantContext.PasswordResetTokens
            .ToListAsync(TestContext.Current.CancellationToken);

        visible.Should().ContainSingle().Which.UserId.Should().Be(localUser.Id);
    }

    [Fact]
    public async Task PasswordResetTokens_WhenTenantIsUnresolved_AreNotReadable()
    {
        string databaseName = Guid.NewGuid().ToString();
        Guid organizationId = Guid.NewGuid();
        SystemScope systemScope = new SystemScope();

        User user = NewUser(organizationId);

        using (SentinelContext seedContext = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext { OrganizationId = organizationId }, systemScope, databaseName))
        using (systemScope.Enter())
        {
            seedContext.AddRange(NewOrganization(organizationId), user, NewPasswordResetToken(user));
            await seedContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using SentinelContext unresolvedContext = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext(), databaseName);

        (await unresolvedContext.PasswordResetTokens.CountAsync(TestContext.Current.CancellationToken)).Should().Be(0);
    }

    [Fact]
    public async Task Query_WhenSystemScopeIsActive_ReturnsEveryTenant()
    {
        string databaseName = Guid.NewGuid().ToString();
        Guid organizationId = Guid.NewGuid();
        Guid foreignOrganizationId = Guid.NewGuid();
        SystemScope systemScope = new SystemScope();

        using SentinelContext context = TestDbContextFactory.CreateInMemory(
            new FakeTenantContext { OrganizationId = organizationId }, systemScope, databaseName);

        using (systemScope.Enter())
        {
            context.AddRange(
                NewOrganization(organizationId),
                NewOrganization(foreignOrganizationId));
            await context.SaveChangesAsync(TestContext.Current.CancellationToken);
            context.ChangeTracker.Clear();

            (await context.Organizations.CountAsync(TestContext.Current.CancellationToken)).Should().Be(2);
        }

        context.ChangeTracker.Clear();

        (await context.Organizations.CountAsync(TestContext.Current.CancellationToken)).Should().Be(1);
    }

    private static PasswordResetToken NewPasswordResetToken(User user) => new()
    {
        UserId = user.Id,
        Email = user.Email,
        TokenHash = $"hash-{Guid.NewGuid():N}",
        ExpiresAt = DateTime.UtcNow.AddHours(1)
    };

    private static Organization NewOrganization(Guid organizationId) => new()
    {
        Id = organizationId,
        Name = "Organisation de test",
        Slug = $"org-{Guid.NewGuid():N}",
        PlanTier = PlanTier.Free,
        SubscriptionStatus = SubscriptionStatus.Active
    };

    private static User NewUser(Guid organizationId) => new()
    {
        OrganizationId = organizationId,
        Email = $"user-{Guid.NewGuid():N}@test.fr",
        FirstName = "Test",
        LastName = "Utilisateur",
        PasswordHash = "hash",
        Role = UserRole.Admin,
        IsActive = true
    };
}
