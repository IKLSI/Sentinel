using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;

namespace Sentinel.Tests.Services;

public class UserSortTranslationTests
{
    private const string UnusedConnectionString =
        "Host=localhost;Database=sentinel_translation_check;Username=none;Password=none";

    private sealed class UnsetTenantContext : ITenantContext
    {
        public Guid? OrganizationId => null;
        public Guid? UserId => null;
        public string? Jti => null;
        public bool IsSet => false;
        public void Reset() { }
    }

    private static SentinelContext CreateNpgsqlContext()
    {
        DbContextOptions<SentinelContext> options = new DbContextOptionsBuilder<SentinelContext>()
            .UseNpgsql(UnusedConnectionString)
            .Options;
        return new SentinelContext(options, new UnsetTenantContext(), new SystemScope());
    }

    private static string SqlFor(UserSortField sortBy, SortDirection direction)
    {
        using SentinelContext context = CreateNpgsqlContext();

        return UserRepository
            .ApplySort(context.Users.AsNoTracking(), sortBy, direction)
            .ThenBy(u => u.Id)
            .ToQueryString();
    }

    [Theory]
    [InlineData(SortDirection.Asc)]
    [InlineData(SortDirection.Desc)]
    public void TriParDerniereConnexion_PlaceLesValeursNullesEnDernier(SortDirection direction)
    {
        string sql = SqlFor(UserSortField.LastLogin, direction);

        string orderBy = sql[sql.IndexOf("ORDER BY", StringComparison.Ordinal)..];

        orderBy.Should().Contain("IS NULL");
        orderBy.IndexOf("IS NULL", StringComparison.Ordinal)
            .Should().BeLessThan(orderBy.LastIndexOf("LastLoginAt", StringComparison.Ordinal));
    }

    [Fact]
    public void TriParRole_UtiliseUnRangExpliciteEtPasLOrdreAlphabetiqueDeLaColonneTexte()
    {
        string sql = SqlFor(UserSortField.Role, SortDirection.Asc);

        string orderBy = sql[sql.IndexOf("ORDER BY", StringComparison.Ordinal)..];

        orderBy.Should().Contain("CASE");
        orderBy.Should().Contain("Admin");
    }

    [Fact]
    public void TriParMembre_OrdonneParNomPuisPrenom()
    {
        string sql = SqlFor(UserSortField.Member, SortDirection.Asc);

        string orderBy = sql[sql.IndexOf("ORDER BY", StringComparison.Ordinal)..];

        orderBy.IndexOf("LastName", StringComparison.Ordinal)
            .Should().BeLessThan(orderBy.IndexOf("FirstName", StringComparison.Ordinal));
    }
}
