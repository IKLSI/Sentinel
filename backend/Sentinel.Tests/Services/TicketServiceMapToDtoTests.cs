using FluentAssertions;
using Sentinel.Application.Services;
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
            TimeEntries = new List<TimeEntry>()
        };

        var dto = TicketService.MapToDto(ticket);

        dto.Id.Should().Be(ticketId);
        dto.Title.Should().Be("Bug critique");
        dto.Description.Should().Be("Détails");
        dto.Priority.Should().Be("critical");
        dto.Type.Should().Be("bug");
        dto.Comments.Should().BeEmpty();
        dto.History.Should().BeEmpty();
        dto.TotalTimeMinutes.Should().Be(0);
    }

    [Fact]
    public void MapToDto_WithTimeEntries_SumsDurations()
    {
        Ticket ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Title = "T",
            CreatedById = Guid.NewGuid(),
            Tags = "[]",
            TimeEntries = new List<TimeEntry>
            {
                new() { DurationMinutes = 60, UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.UtcNow) },
                new() { DurationMinutes = 45, UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.UtcNow) },
            },
            Comments = new List<TicketComment>(),
            History = new List<TicketHistory>(),
        };

        var dto = TicketService.MapToDto(ticket);

        dto.TotalTimeMinutes.Should().Be(105);
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
            TimeEntries = new List<TimeEntry>(),
        };

        var dto = TicketService.MapToDto(ticket);

        dto.Comments.Should().HaveCount(2);
        dto.Comments[0].Content.Should().Be("premier");
        dto.Comments[1].Content.Should().Be("deuxième");
    }
}
