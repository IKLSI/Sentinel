using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;

namespace Sentinel.Tests.Services;

public class TicketSortTranslationTests
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

    private static string OrderByClauseFor(TicketSortField sortBy, SortDirection direction)
    {
        using SentinelContext context = CreateNpgsqlContext();

        string sql = TicketRepository
            .ApplySort(context.Tickets.AsNoTracking(), sortBy, direction)
            .ThenByDescending(t => t.CreatedAt)
            .ThenBy(t => t.Id)
            .ToQueryString();

        return sql[sql.IndexOf("ORDER BY", StringComparison.Ordinal)..];
    }

    [Theory]
    [InlineData(SortDirection.Asc)]
    [InlineData(SortDirection.Desc)]
    public void TriParAssigne_PlaceLesTicketsNonAssignesEnDernier(SortDirection direction)
    {
        string orderBy = OrderByClauseFor(TicketSortField.Assignee, direction);

        orderBy.Should().Contain("IS NULL");
        orderBy.IndexOf("IS NULL", StringComparison.Ordinal)
            .Should().BeLessThan(orderBy.IndexOf("FirstName", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(TicketSortField.Status, "'New' THEN 0", "'Resolved' THEN 3")]
    public void TriParEnum_UtiliseUnRangExpliciteEtPasLOrdreAlphabetiqueDeLaColonneTexte(
        TicketSortField sortBy, string firstRank, string laterRank)
    {
        string orderBy = OrderByClauseFor(sortBy, SortDirection.Asc);

        orderBy.Should().Contain("CASE");
        orderBy.Should().Contain(firstRank);
        orderBy.Should().Contain(laterRank);
    }

    [Fact]
    public void TriParPriorite_DecroissantOrdonneLeRangAvantLesCriteresDeStabilite()
    {
        string orderBy = OrderByClauseFor(TicketSortField.Priority, SortDirection.Desc);

        orderBy.IndexOf("\"PriorityRank\" DESC", StringComparison.Ordinal)
            .Should().BeGreaterThan(-1)
            .And.BeLessThan(orderBy.IndexOf("CreatedAt", StringComparison.Ordinal));
    }

    [Fact]
    public void TriParPriorite_UtiliseLaColonneCalculeeStockeeSansCase()
    {
        string orderBy = OrderByClauseFor(TicketSortField.Priority, SortDirection.Asc);

        orderBy.Should().Contain("\"PriorityRank\"");
        orderBy.Should().NotContain("CASE");
    }
}
