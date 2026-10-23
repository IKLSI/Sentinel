using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Auth.AccountState;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class AccountSessionValidatorTests
{
    private readonly MemoryCache _cache = new(new MemoryCacheOptions());

    [Fact]
    public async Task IsSessionValidAsync_ActiveUserWithCurrentTokenVersion_ReturnsTrue()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(NewUser(scope, UserAccessStatus.Active, tokenVersion: 3));

        bool valid = await NewValidator(scope).IsSessionValidAsync(scope.UserId, 3, CancellationToken.None);

        valid.Should().BeTrue();
    }

    [Fact]
    public async Task IsSessionValidAsync_RevokedTokenVersion_ReturnsFalse()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(NewUser(scope, UserAccessStatus.Active, tokenVersion: 4));

        bool valid = await NewValidator(scope).IsSessionValidAsync(scope.UserId, 3, CancellationToken.None);

        valid.Should().BeFalse();
    }

    [Fact]
    public async Task IsSessionValidAsync_SuspendedUser_ReturnsFalse()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(NewUser(scope, UserAccessStatus.Suspended, tokenVersion: 1));

        bool valid = await NewValidator(scope).IsSessionValidAsync(scope.UserId, 1, CancellationToken.None);

        valid.Should().BeFalse();
    }

    [Fact]
    public async Task IsSessionValidAsync_UnknownUser_ReturnsFalseWithoutCaching()
    {
        using TestScope scope = new TestScope();

        bool valid = await NewValidator(scope).IsSessionValidAsync(Guid.NewGuid(), 0, CancellationToken.None);

        valid.Should().BeFalse();
        _cache.Count.Should().Be(0);
    }

    [Fact]
    public async Task IsSessionValidAsync_CachesTheAccountStateUntilInvalidated()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(NewUser(scope, UserAccessStatus.Active, tokenVersion: 1));
        AccountSessionValidator sut = NewValidator(scope);

        await sut.IsSessionValidAsync(scope.UserId, 1, CancellationToken.None);

        _cache.TryGetValue(CacheKeys.AuthAccount(scope.UserId), out object? cached).Should().BeTrue();
        cached.Should().NotBeNull();
    }

    private AccountSessionValidator NewValidator(TestScope scope) =>
        new(scope.Users, new FakeSystemScope(), _cache);

    private static User NewUser(TestScope scope, UserAccessStatus accessStatus, int tokenVersion) => new()
    {
        Id = scope.UserId,
        OrganizationId = scope.OrganizationId,
        Email = $"session-{scope.UserId:N}@test.fr",
        FirstName = "Session",
        LastName = "Test",
        PasswordHash = "hash",
        Role = UserRole.Developer,
        AccessStatus = accessStatus,
        TokenVersion = tokenVersion
    };
}
