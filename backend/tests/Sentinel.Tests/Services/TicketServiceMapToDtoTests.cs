using FluentAssertions;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Tests.Services;

public class TicketServiceMapToDtoTests
{
    [Fact]
    public void MapToDto_BasicTicket_MapsAllScalarFields()
    {
        Guid ticketId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;

        Ticket ticket = new Ticket
        {
            Id = ticketId,
            OrganizationId = Guid.NewGuid(),
            Title = "Bug critique",
            Description = "Détails",
            Priority = TicketPriority.Critical,
            Type = TicketType.Bug,
            CreatedById = Guid.NewGuid(),
            CreatedAt = now,
            UpdatedAt = now,
            Tags = "[]",
            Comments = new List<TicketComment>(),
            History = new List<TicketHistory>(),
        };

        var dto = TicketMapper.ToDto(ticket);

        dto.Id.Should().Be(ticketId);
        dto.Title.Should().Be("Bug critique");
        dto.Description.Should().Be("Détails");
        dto.Priority.Should().Be("critical");
        dto.Type.Should().Be("bug");
        dto.Comments.Should().BeEmpty();
        dto.History.Should().BeEmpty();
    }

    [Fact]
    public void MapToDto_OrdersCommentsByCreatedAtAscending()
    {
        Guid authorId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;

        Ticket ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Title = "T",
            CreatedById = authorId,
            Tags = "[]",
            Comments = new List<TicketComment>
            {
                new() { Id = Guid.NewGuid(), AuthorId = authorId, Content = "deuxième", CreatedAt = now.AddMinutes(2) },
                new() { Id = Guid.NewGuid(), AuthorId = authorId, Content = "premier", CreatedAt = now.AddMinutes(1) },
            },
            History = new List<TicketHistory>(),
        };

        var dto = TicketMapper.ToDto(ticket);

        dto.Comments.Should().HaveCount(2);
        dto.Comments[0].Content.Should().Be("premier");
        dto.Comments[1].Content.Should().Be("deuxième");
    }
}
