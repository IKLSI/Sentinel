using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Tickets;
using Sentinel.Application.Tickets.Update;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class TicketUpdateServiceTests
{
    [Fact]
    public async Task ExecuteAsync_WithoutAssignee_KeepsTheCurrentAssignee()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = await SeedAssignedTicketAsync(scope);

        Result<TicketDto> result = await NewService(scope).ExecuteAsync(ticket.Id,
            new UpdateTicketDto { Title = "Titre modifié" }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.AssignedToId.Should().Be(scope.UserId);
        result.Value.Title.Should().Be("Titre modifié");
    }

    [Fact]
    public async Task ExecuteAsync_WithClearAssignee_RemovesTheAssignee()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = await SeedAssignedTicketAsync(scope);

        Result<TicketDto> result = await NewService(scope).ExecuteAsync(ticket.Id,
            new UpdateTicketDto { ClearAssignee = true }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.AssignedToId.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteAsync_WithExplicitAssignee_PrefersItOverClear()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = await SeedAssignedTicketAsync(scope);

        Result<TicketDto> result = await NewService(scope).ExecuteAsync(ticket.Id,
            new UpdateTicketDto { AssignedToId = scope.UserId, ClearAssignee = true }, CancellationToken.None);

        result.Value!.AssignedToId.Should().Be(scope.UserId);
    }

    private static async Task<Ticket> SeedAssignedTicketAsync(TestScope scope)
    {
        Ticket ticket = new Ticket
        {
            OrganizationId = scope.OrganizationId,
            Title = "Ticket",
            Description = "Description",
            CreatedById = scope.UserId,
            AssignedToId = scope.UserId
        };

        await scope.SeedAsync(scope.NewOrganization(), new User
        {
            Id = scope.UserId,
            OrganizationId = scope.OrganizationId,
            Email = $"assigne-{scope.UserId:N}@test.fr",
            FirstName = "Assigné",
            LastName = "Test",
            PasswordHash = "hash",
            Role = UserRole.Developer,
            AccessStatus = UserAccessStatus.Active
        }, ticket);

        return ticket;
    }

    private static TicketUpdateService NewService(TestScope scope) => new(
        scope.Tickets,
        new TicketHistoryRepository(scope.Context),
        new TicketLinkChecker(scope.Projects, scope.Users),
        scope.CommitScopeFactory,
        new DashboardCache(new MemoryCache(new MemoryCacheOptions())),
        new FakeAuditLogService(),
        new NoopRealtimeNotifier(),
        scope.Tenant,
        new TicketUpdateValidator());
}
