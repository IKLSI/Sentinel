using FluentAssertions;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services;

public class TicketServiceMapToDtoTests
{
    [Fact]
    public void MapToDto_BasicTicket_MapsAllScalarFields()
    {
        Guid ticketId = Guid.NewGuid();

        TicketDto dto = TicketMapper.ToDto(NewDetail(ticketId, comments: []) with
        {
            Title = "Bug critique",
            Description = "Détails",
            Priority = TicketPriority.Critical,
            Type = TicketType.Bug,
        });

        dto.Id.Should().Be(ticketId);
        dto.Title.Should().Be("Bug critique");
        dto.Description.Should().Be("Détails");
        dto.Priority.Should().Be("critical");
        dto.Type.Should().Be("bug");
        dto.Comments.Should().BeEmpty();
        dto.History.Should().BeEmpty();
    }

    [Fact]
    public void MapToDto_KeepsCommentOrderAndComposesNames()
    {
        Guid authorId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;

        TicketDto dto = TicketMapper.ToDto(NewDetail(Guid.NewGuid(), comments:
        [
            new TicketCommentRow(Guid.NewGuid(), authorId, "Ada", "Lovelace", "premier", now.AddMinutes(1)),
            new TicketCommentRow(Guid.NewGuid(), authorId, "Ada", "", "deuxième", now.AddMinutes(2)),
        ]));

        dto.CommentCount.Should().Be(2);
        dto.Comments.Select(comment => comment.Content).Should().Equal("premier", "deuxième");
        dto.Comments.Select(comment => comment.AuthorName).Should().Equal("Ada Lovelace", "Ada");
        dto.CreatedByName.Should().Be(string.Empty);
    }

    private static TicketDetailRow NewDetail(Guid id, IReadOnlyList<TicketCommentRow> comments) => new(
        id, 1, null, null, "T", string.Empty, TicketPriority.Medium, TicketType.Bug, TicketStatus.New,
        null, null, null, null, null, DateTime.UtcNow, null, null, comments, []);
}
