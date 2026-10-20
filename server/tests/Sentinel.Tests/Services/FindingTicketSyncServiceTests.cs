using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class FindingTicketSyncServiceTests
{
    private static readonly string LodashCve = FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "lodash", "GHSA-1");

    [Fact]
    public async Task SyncAsync_QuandLeFindingADisparu_ResoutLeTicketEtTraceUneActionSysteme()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = NewTicket(scope, TicketStatus.InProgress);
        await scope.SeedAsync(ticket);

        await BuildSut(scope).SyncAsync(NewProject(scope, withCve: false), TestContext.Current.CancellationToken);

        Ticket reloaded = await ReloadAsync(scope, ticket.Id);
        reloaded.Status.Should().Be(TicketStatus.Resolved);
        reloaded.AutoResolvedAt.Should().NotBeNull();

        TicketHistory history = await scope.Context.TicketHistories.SingleAsync(TestContext.Current.CancellationToken);
        history.UserId.Should().BeNull();
        history.OldValue.Should().Be("inprogress");
        history.NewValue.Should().Be("resolved");
    }

    [Fact]
    public async Task SyncAsync_QuandLeFindingEstToujoursPresent_NeTouchePasAuTicket()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = NewTicket(scope, TicketStatus.New);
        await scope.SeedAsync(ticket);

        await BuildSut(scope).SyncAsync(NewProject(scope, withCve: true), TestContext.Current.CancellationToken);

        (await ReloadAsync(scope, ticket.Id)).Status.Should().Be(TicketStatus.New);
        scope.Context.TicketHistories.Should().BeEmpty();
    }

    [Fact]
    public async Task SyncAsync_RetourneLesTicketsLiesAuxFindingsDuProjet()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = NewTicket(scope, TicketStatus.InProgress);
        await scope.SeedAsync(ticket);

        FindingTicketSyncResult? result = await BuildSut(scope).SyncAsync(NewProject(scope, withCve: false),
            TestContext.Current.CancellationToken);

        result!.LinkedTickets.Should().ContainSingle().Which.Id.Should().Be(ticket.Id);
        result.TicketsChanged.Should().BeTrue();
    }

    [Fact]
    public async Task SyncAsync_QuandLeFindingRevientApresUneResolutionAutomatique_RouvreLeTicket()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = NewTicket(scope, TicketStatus.Resolved);
        ticket.AutoResolvedAt = DateTime.UtcNow.AddDays(-1);
        await scope.SeedAsync(ticket);

        await BuildSut(scope).SyncAsync(NewProject(scope, withCve: true), TestContext.Current.CancellationToken);

        Ticket reloaded = await ReloadAsync(scope, ticket.Id);
        reloaded.Status.Should().Be(TicketStatus.New);
        reloaded.AutoResolvedAt.Should().BeNull();
    }

    [Fact]
    public async Task SyncAsync_QuandLeTicketAEteResoluManuellement_NeLeRouvrePas()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = NewTicket(scope, TicketStatus.Resolved);
        await scope.SeedAsync(ticket);

        await BuildSut(scope).SyncAsync(NewProject(scope, withCve: true), TestContext.Current.CancellationToken);

        (await ReloadAsync(scope, ticket.Id)).Status.Should().Be(TicketStatus.Resolved);
    }

    [Fact]
    public async Task SyncAsync_QuandLeTicketEstFerme_NeLeTouchePas()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = NewTicket(scope, TicketStatus.Closed);
        ticket.AutoResolvedAt = DateTime.UtcNow;
        await scope.SeedAsync(ticket);

        await BuildSut(scope).SyncAsync(NewProject(scope, withCve: true), TestContext.Current.CancellationToken);

        (await ReloadAsync(scope, ticket.Id)).Status.Should().Be(TicketStatus.Closed);
    }

    [Fact]
    public async Task SyncAsync_QuandUnAutreTicketEstDejaOuvert_NeRouvrePasLAncien()
    {
        using TestScope scope = new TestScope();
        Ticket autoResolved = NewTicket(scope, TicketStatus.Resolved);
        autoResolved.AutoResolvedAt = DateTime.UtcNow.AddDays(-1);
        Ticket open = NewTicket(scope, TicketStatus.New);
        await scope.SeedAsync(autoResolved, open);

        await BuildSut(scope).SyncAsync(NewProject(scope, withCve: true), TestContext.Current.CancellationToken);

        (await ReloadAsync(scope, autoResolved.Id)).Status.Should().Be(TicketStatus.Resolved);
    }

    private static FindingTicketSyncService BuildSut(TestScope scope) => new(
        scope.Tickets,
        new TicketHistoryRepository(scope.Context),
        scope.CommitScopeFactory,
        new FakeAuditLogService(),
        NullLogger<FindingTicketSyncService>.Instance);

    private static Task<Ticket> ReloadAsync(TestScope scope, Guid ticketId) =>
        scope.Context.Tickets.AsNoTracking().SingleAsync(t => t.Id == ticketId, TestContext.Current.CancellationToken);

    private static readonly Guid ProjectId = Guid.NewGuid();

    private static Project NewProject(TestScope scope, bool withCve)
    {
        Dependency lodash = new()
        {
            Name = "lodash",
            CurrentVersion = "4.17.21",
            LatestVersion = "4.17.21",
            Ecosystem = DependencyEcosystem.Npm
        };

        if (withCve)
            lodash.Vulnerabilities.Add(new Vulnerability { CveId = "GHSA-1", PackageName = "lodash" });

        return new Project
        {
            Id = ProjectId,
            OrganizationId = scope.OrganizationId,
            Name = "Projet",
            Dependencies = new List<Dependency> { lodash },
            Runtimes = new List<Runtime>()
        };
    }

    private static Ticket NewTicket(TestScope scope, TicketStatus status) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = scope.OrganizationId,
        ProjectId = ProjectId,
        Title = "Ticket lié",
        Status = status,
        CreatedById = scope.UserId,
        FindingKind = FindingKind.Vulnerability,
        FindingKey = LodashCve
    };
}
