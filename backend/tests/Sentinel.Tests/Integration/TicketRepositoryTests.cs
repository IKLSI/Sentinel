using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class TicketRepositoryTests
{
    private readonly PostgresFixture _fixture;

    public TicketRepositoryTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task SearchAsync_QuandLaRechercheDiffereParLaCasse_RemonteLeTicket()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());
        await scope.SeedAsync(scope.NewTicket("Fuite mémoire sur le Scanner"));

        PagedList<Ticket> page = await scope.Tickets.SearchAsync(
            scope.OrganizationId, new TicketFilter { Search = "SCANNER" }, 1, 20, CancellationToken.None);

        page.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task SearchAsync_QuandLeTermeEstDansUnCommentaire_RemonteLeTicket()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());

        Ticket ticket = scope.NewTicket("Titre sans rapport");
        await scope.SeedAsync(ticket);
        await scope.SeedAsync(new TicketComment
        {
            TicketId = ticket.Id,
            AuthorId = scope.UserId,
            Content = "La régression vient du parseur de manifeste"
        });

        PagedList<Ticket> page = await scope.Tickets.SearchAsync(
            scope.OrganizationId, new TicketFilter { Search = "parseur" }, 1, 20, CancellationToken.None);

        page.TotalCount.Should().Be(1);
        page.Items.Single().Id.Should().Be(ticket.Id);
    }

    [Fact]
    public async Task SearchAsync_QuandLeTermeContientUnCaractereJoker_NeLeTraitePasCommeUnMotif()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());
        await scope.SeedAsync(scope.NewTicket("Un titre quelconque"));

        PagedList<Ticket> page = await scope.Tickets.SearchAsync(
            scope.OrganizationId, new TicketFilter { Search = "%" }, 1, 20, CancellationToken.None);

        page.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task DeleteInOrganizationAsync_SupprimeLeTicketEtSesCommentairesEnCascade()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());

        Ticket ticket = scope.NewTicket("Ticket à supprimer");
        await scope.SeedAsync(ticket);
        await scope.SeedAsync(new TicketComment
        {
            TicketId = ticket.Id,
            AuthorId = scope.UserId,
            Content = "Commentaire lié"
        });

        int deleted = await scope.Tickets.DeleteInOrganizationAsync(
            ticket.Id, scope.OrganizationId, CancellationToken.None);

        deleted.Should().Be(1);

        scope.Context.ChangeTracker.Clear();

        (await scope.Context.Tickets.AnyAsync(t => t.Id == ticket.Id)).Should().BeFalse();
        (await scope.Context.TicketComments.AnyAsync(c => c.TicketId == ticket.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteInOrganizationAsync_QuandLeTicketAppartientAUneAutreOrganisation_NeSupprimeRien()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);

        Guid foreignOrganizationId = Guid.NewGuid();
        Guid foreignUserId = Guid.NewGuid();

        await scope.SeedAsSystemAsync(
            scope.NewOrganization(foreignOrganizationId),
            scope.NewUser(foreignUserId, foreignOrganizationId));

        Ticket foreignTicket = scope.NewTicket("Ticket d'une autre organisation", foreignOrganizationId, foreignUserId);
        await scope.SeedAsSystemAsync(foreignTicket);

        int deleted = await scope.Tickets.DeleteInOrganizationAsync(
            foreignTicket.Id, scope.OrganizationId, CancellationToken.None);

        deleted.Should().Be(0);
    }

    [Fact]
    public async Task GetOrDefaultWithDetailsAsync_ChargeLesRelationsEnRequetesSeparees()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());

        Ticket ticket = scope.NewTicket("Ticket détaillé");
        await scope.SeedAsync(ticket);
        await scope.SeedAsync(new TicketComment
        {
            TicketId = ticket.Id,
            AuthorId = scope.UserId,
            Content = "Premier commentaire"
        });

        Ticket? loaded = await scope.Tickets.GetOrDefaultWithDetailsAsync(ticket.Id, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.CreatedBy.Should().NotBeNull();
        loaded.Comments.Should().ContainSingle();
        loaded.Comments.Single().Author.Should().NotBeNull();
    }

    [Fact]
    public async Task LesPolitiquesRls_MasquentLesTicketsDesAutresOrganisations()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);

        Guid foreignOrganizationId = Guid.NewGuid();
        Guid foreignUserId = Guid.NewGuid();

        await scope.SeedAsSystemAsync(
            scope.NewOrganization(foreignOrganizationId),
            scope.NewUser(foreignUserId, foreignOrganizationId));

        Ticket foreignTicket = scope.NewTicket("Ticket confidentiel", foreignOrganizationId, foreignUserId);
        await scope.SeedAsSystemAsync(foreignTicket);

        int visible = await scope.Context.Tickets
            .IgnoreQueryFilters()
            .CountAsync(t => t.Id == foreignTicket.Id);

        visible.Should().Be(0, "la sécurité au niveau ligne doit filtrer même sans le filtre EF Core");
    }
}
