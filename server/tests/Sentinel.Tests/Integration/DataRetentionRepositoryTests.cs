using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class DataRetentionRepositoryTests
{
    private readonly PostgresFixture _fixture;

    public DataRetentionRepositoryTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task DeleteExpiredPasswordResetTokensAsync_SupprimeSeulementLesJetonsExpiresAvantLeSeuil()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        User user = scope.NewUser();
        await scope.SeedAsync(scope.NewOrganization(), user);

        PasswordResetToken stale = NewToken(user, DateTime.UtcNow.AddDays(-10));
        PasswordResetToken recent = NewToken(user, DateTime.UtcNow.AddDays(-1));
        await scope.SeedAsSystemAsync(stale, recent);

        DataRetentionRepository sut = new DataRetentionRepository(scope.Context);

        using (scope.SystemScope.Enter())
        {
            int deleted = await sut.DeleteExpiredPasswordResetTokensAsync(DateTime.UtcNow.AddDays(-7),
                TestContext.Current.CancellationToken);

            deleted.Should().Be(1);
            (await scope.Context.Set<PasswordResetToken>().AnyAsync(t => t.Id == recent.Id,
                TestContext.Current.CancellationToken)).Should().BeTrue();
        }
    }

    private static PasswordResetToken NewToken(User user, DateTime expiresAt) => new()
    {
        UserId = user.Id,
        Email = user.Email,
        TokenHash = Guid.NewGuid().ToString("N"),
        ExpiresAt = expiresAt
    };
}
