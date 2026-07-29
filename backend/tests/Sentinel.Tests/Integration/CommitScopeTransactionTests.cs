using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Models;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class CommitScopeTransactionTests
{
    private readonly PostgresFixture _fixture;

    public CommitScopeTransactionTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task ExecuteInTransactionAsync_QuandLOperationAboutit_EnregistreToutesLesEcritures()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());

        Ticket premier = scope.NewTicket("Premier ticket transactionnel");
        Ticket second = scope.NewTicket("Second ticket transactionnel");

        await scope.CommitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            await scope.Tickets.AddAsync(premier, token);
            await scope.Tickets.AddAsync(second, token);
        }, CancellationToken.None);

        scope.Context.ChangeTracker.Clear();

        int count = await scope.Context.Tickets.CountAsync();

        count.Should().Be(2);
    }

    [Fact]
    public async Task ExecuteInTransactionAsync_QuandLOperationEchoue_NEnregistreRien()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());

        Ticket ticket = scope.NewTicket("Ticket abandonné");

        Func<Task> operation = () => scope.CommitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            await scope.Tickets.AddAsync(ticket, token);
            await scope.Context.SaveChangesAsync(token);

            throw new InvalidOperationException("échec métier après une première écriture");
        }, CancellationToken.None);

        await operation.Should().ThrowAsync<InvalidOperationException>();

        scope.Context.ChangeTracker.Clear();

        bool exists = await scope.Context.Tickets.AnyAsync(t => t.Id == ticket.Id);

        exists.Should().BeFalse("la transaction doit être annulée intégralement");
    }
}
