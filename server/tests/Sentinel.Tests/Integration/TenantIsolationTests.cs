using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Data;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class TenantIsolationTests
{
    private readonly PostgresFixture _fixture;

    public TenantIsolationTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task SansOrganisationCourante_AucuneLigneNEstVisible()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());

        Ticket ticket = scope.NewTicket("Ticket de l'organisation courante");
        await scope.SeedAsync(ticket);

        await using SentinelContext anonymousContext = _fixture.CreateContext(
            new FakeTenantContext(), new SystemScope());

        int visible = await anonymousContext.Tickets
            .IgnoreQueryFilters()
            .CountAsync(t => t.Id == ticket.Id, TestContext.Current.CancellationToken);

        visible.Should().Be(0, "the policies must close when no organization is set");
    }

    [Fact]
    public async Task LesPolitiquesRls_MasquentLesCommentairesDesAutresOrganisations()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);

        Guid foreignOrganizationId = Guid.NewGuid();
        Guid foreignUserId = Guid.NewGuid();

        await scope.SeedAsSystemAsync(
            scope.NewOrganization(foreignOrganizationId),
            scope.NewUser(foreignUserId, foreignOrganizationId));

        Ticket foreignTicket = scope.NewTicket("Ticket étranger", foreignOrganizationId, foreignUserId);
        await scope.SeedAsSystemAsync(foreignTicket);

        TicketComment foreignComment = new TicketComment
        {
            TicketId = foreignTicket.Id,
            AuthorId = foreignUserId,
            Content = "Commentaire confidentiel"
        };

        await scope.SeedAsSystemAsync(foreignComment);

        int visible = await scope.Context.TicketComments
            .IgnoreQueryFilters()
            .CountAsync(c => c.Id == foreignComment.Id, TestContext.Current.CancellationToken);

        visible.Should().Be(0, "the indirect comment policy must filter without the EF Core filter");
    }

    [Fact]
    public async Task LesPolitiquesRls_MasquentLesVulnerabilitesDesAutresOrganisations()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);

        Guid foreignOrganizationId = Guid.NewGuid();

        await scope.SeedAsSystemAsync(scope.NewOrganization(foreignOrganizationId));

        Project foreignProject = scope.NewProject(organizationId: foreignOrganizationId);
        await scope.SeedAsSystemAsync(foreignProject);

        Dependency foreignDependency = scope.NewDependency(foreignProject.Id, foreignOrganizationId);
        await scope.SeedAsSystemAsync(foreignDependency);

        Vulnerability foreignVulnerability = scope.NewVulnerability(foreignDependency.Id, foreignOrganizationId);
        await scope.SeedAsSystemAsync(foreignVulnerability);

        int visibleDependencies = await scope.Context.Dependencies
            .IgnoreQueryFilters()
            .CountAsync(d => d.Id == foreignDependency.Id, TestContext.Current.CancellationToken);

        int visibleVulnerabilities = await scope.Context.Vulnerabilities
            .IgnoreQueryFilters()
            .CountAsync(v => v.Id == foreignVulnerability.Id, TestContext.Current.CancellationToken);

        visibleDependencies.Should().Be(0);
        visibleVulnerabilities.Should().Be(0, "the cascading project → dependency → vulnerability policy must filter");
    }

    [Fact]
    public async Task LesPolitiquesRls_RefusentLaCreationDansUneAutreOrganisation()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());

        Guid foreignOrganizationId = Guid.NewGuid();
        Guid foreignUserId = Guid.NewGuid();

        await scope.SeedAsSystemAsync(
            scope.NewOrganization(foreignOrganizationId),
            scope.NewUser(foreignUserId, foreignOrganizationId));

        Ticket smuggled = scope.NewTicket("Ticket injecté", foreignOrganizationId, foreignUserId);

        scope.Context.Add(smuggled);

        Func<Task> insertion = () => scope.Context.SaveChangesAsync(TestContext.Current.CancellationToken);

        await insertion.Should().ThrowAsync<DbUpdateException>(
            "the WITH CHECK clause inferred from the policy must reject a write outside the current organization");

        scope.Context.ChangeTracker.Clear();
    }

    [Fact]
    public async Task LesPolitiquesRls_EmpechentLaModificationDesTicketsDesAutresOrganisations()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);

        Guid foreignOrganizationId = Guid.NewGuid();
        Guid foreignUserId = Guid.NewGuid();

        await scope.SeedAsSystemAsync(
            scope.NewOrganization(foreignOrganizationId),
            scope.NewUser(foreignUserId, foreignOrganizationId));

        Ticket foreignTicket = scope.NewTicket("Ticket étranger à modifier", foreignOrganizationId, foreignUserId);
        await scope.SeedAsSystemAsync(foreignTicket);

        int updated = await scope.Context.Tickets
            .IgnoreQueryFilters()
            .Where(t => t.Id == foreignTicket.Id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.Title, "Titre détourné"),
                TestContext.Current.CancellationToken);

        updated.Should().Be(0);
    }
}
