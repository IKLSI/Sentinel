using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets;
using Sentinel.Application.Tickets.CreateFromFinding;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class TicketCreateFromFindingServiceTests
{
    private readonly PostgresFixture _fixture;

    public TicketCreateFromFindingServiceTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task ExecuteAsync_CreeUnTicketLieAuFindingPuisRenvoieLeMemeAuSecondAppel()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        Project project = scope.NewProject();
        Dependency dependency = scope.NewDependency(project.Id);
        Vulnerability vulnerability = scope.NewVulnerability(dependency.Id);
        vulnerability.Severity = VulnerabilitySeverity.Critical;
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());
        await scope.SeedAsync(project, dependency, vulnerability);

        CreateTicketFromFindingRequest request = new()
        {
            ProjectId = project.Id,
            Kind = FindingKind.Vulnerability,
            FindingKey = FindingKeys.ForVulnerability(dependency.Ecosystem, vulnerability.PackageName,
                vulnerability.CveId)
        };

        Result<TicketDto> first = await BuildSut(scope).ExecuteAsync(request, CancellationToken.None);
        Result<TicketDto> second = await BuildSut(scope).ExecuteAsync(request, CancellationToken.None);

        first.IsSuccess.Should().BeTrue();
        first.Value!.Priority.Should().Be("critical");
        first.Value.Type.Should().Be("security");
        first.Value.FindingKind.Should().Be(nameof(FindingKind.Vulnerability));
        second.Value!.Id.Should().Be(first.Value.Id);
    }

    [Fact]
    public async Task IndexUnique_RefuseDeuxTicketsOuvertsPourLeMemeFinding()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        Project project = scope.NewProject();
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser());
        await scope.SeedAsync(project);

        Ticket first = LinkedTicket(scope, project.Id, TicketStatus.New);
        Ticket resolved = LinkedTicket(scope, project.Id, TicketStatus.Resolved);
        await scope.SeedAsync(first, resolved);

        Func<Task> duplicate = () => scope.SeedAsync(LinkedTicket(scope, project.Id, TicketStatus.InProgress));

        await duplicate.Should().ThrowAsync<DbUpdateException>();
    }

    private static Ticket LinkedTicket(PostgresScope scope, Guid projectId, TicketStatus status)
    {
        Ticket ticket = scope.NewTicket("Ticket lié");
        ticket.ProjectId = projectId;
        ticket.Status = status;
        ticket.FindingKind = FindingKind.EolRuntime;
        ticket.FindingKey = FindingKeys.ForRuntime("nodejs");

        return ticket;
    }

    private static TicketCreateFromFindingService BuildSut(PostgresScope scope) => new(
        scope.Tickets,
        scope.Projects,
        scope.Users,
        TestLocalizer.Create(),
        new TicketCreator(
            scope.Tickets,
            scope.Organizations,
            scope.CommitScopeFactory,
            new FakeAuditLogService(),
            scope.Tenant),
        new NoopRealtimeNotifier(),
        scope.Tenant,
        new TicketCreateFromFindingValidator());
}
