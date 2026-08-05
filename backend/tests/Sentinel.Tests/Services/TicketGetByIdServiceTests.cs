using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets.GetById;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;
using Sentinel.Application.Tickets;

namespace Sentinel.Tests.Services;

public class TicketGetByIdServiceTests
{
    [Fact]
    public async Task ExecuteAsync_WhenTicketBelongsToTenant_ReturnsSuccess()
    {
        using TestScope scope = new TestScope();
        Ticket ticket = NewTicket(scope.OrganizationId, scope.UserId);
        await scope.SeedAsync(NewAuthor(scope.OrganizationId, scope.UserId), ticket);

        TicketGetByIdService sut = new TicketGetByIdService(scope.Tickets, scope.Tenant);

        Result<TicketDto> result = await sut.ExecuteAsync(ticket.Id, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(ticket.Id);
    }

    [Fact]
    public async Task ExecuteAsync_WhenTicketBelongsToAnotherOrganization_ReturnsNotFound()
    {
        using TestScope scope = new TestScope();
        Guid foreignOrganizationId = Guid.NewGuid();
        Guid foreignUserId = Guid.NewGuid();
        Ticket foreignTicket = NewTicket(foreignOrganizationId, foreignUserId);
        await scope.SeedAsync(NewAuthor(foreignOrganizationId, foreignUserId), foreignTicket);

        TicketGetByIdService sut = new TicketGetByIdService(scope.Tickets, scope.Tenant);

        Result<TicketDto> result = await sut.ExecuteAsync(foreignTicket.Id, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Status.Should().Be(ResultStatus.NotFound);
        result.Code.Should().Be(ErrorCodes.TicketNotFound);
    }

    [Fact]
    public async Task ExecuteAsync_WhenTenantIsNotResolved_ReturnsUnauthorized()
    {
        using TestScope scope = new TestScope();
        scope.Tenant.OrganizationId = null;

        TicketGetByIdService sut = new TicketGetByIdService(scope.Tickets, scope.Tenant);

        Result<TicketDto> result = await sut.ExecuteAsync(Guid.NewGuid(), CancellationToken.None);

        result.Status.Should().Be(ResultStatus.Unauthorized);
    }

    private static User NewAuthor(Guid organizationId, Guid userId) => new()
    {
        Id = userId,
        OrganizationId = organizationId,
        Email = $"auteur-{userId:N}@test.fr",
        FirstName = "Auteur",
        LastName = "Test",
        PasswordHash = "hash",
        Role = UserRole.Developer,
        AccessStatus = UserAccessStatus.Active
    };

    private static Ticket NewTicket(Guid organizationId, Guid createdById) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = organizationId,
        Title = "Ticket de test",
        Description = "Description",
        Priority = TicketPriority.Medium,
        Type = TicketType.Bug,
        CreatedById = createdById,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };
}
