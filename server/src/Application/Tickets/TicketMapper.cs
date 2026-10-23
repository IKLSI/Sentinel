using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets;

public static class TicketMapper
{
    public static TicketDto ToDto(TicketDetailRow ticket) => new()
    {
        Id = ticket.Id,
        Reference = TicketReference.For(ticket.Number),
        ProjectId = ticket.ProjectId,
        ProjectName = ticket.ProjectName,
        Title = ticket.Title,
        Description = ticket.Description,
        Priority = ticket.Priority.ToString().ToLower(),
        Type = ticket.Type.ToString().ToLower(),
        Status = ticket.Status.ToString().ToLower(),
        AssignedToId = ticket.AssignedToId,
        AssignedToName = PersonName.Format(ticket.AssignedToFirstName, ticket.AssignedToLastName),
        CreatedByName = PersonName.Format(ticket.CreatedByFirstName, ticket.CreatedByLastName) ?? string.Empty,
        CreatedAt = ticket.CreatedAt,
        CommentCount = ticket.Comments.Count,
        FindingKind = ticket.FindingKind?.ToString(),
        FindingKey = ticket.FindingKey,
        Comments = ticket.Comments.Select(ToDto).ToList(),
        History = ticket.History.Select(ToDto).ToList()
    };

    public static TicketDto ToDto(TicketGridRow row) => new()
    {
        Id = row.Id,
        Reference = TicketReference.For(row.Number),
        ProjectId = row.ProjectId,
        ProjectName = row.ProjectName,
        Title = row.Title,
        Description = row.Description,
        Priority = row.Priority.ToString().ToLower(),
        Type = row.Type.ToString().ToLower(),
        Status = row.Status.ToString().ToLower(),
        AssignedToId = row.AssignedToId,
        AssignedToName = PersonName.Format(row.AssignedToFirstName, row.AssignedToLastName),
        CreatedByName = PersonName.Format(row.CreatedByFirstName, row.CreatedByLastName) ?? string.Empty,
        CreatedAt = row.CreatedAt,
        CommentCount = row.CommentCount
    };

    public static TicketCommentDto ToDto(TicketComment comment) => new()
    {
        Id = comment.Id,
        AuthorId = comment.AuthorId,
        AuthorName = comment.Author?.FullName ?? string.Empty,
        Content = comment.Content,
        CreatedAt = comment.CreatedAt
    };

    private static TicketCommentDto ToDto(TicketCommentRow comment) => new()
    {
        Id = comment.Id,
        AuthorId = comment.AuthorId,
        AuthorName = PersonName.Format(comment.AuthorFirstName, comment.AuthorLastName) ?? string.Empty,
        Content = comment.Content,
        CreatedAt = comment.CreatedAt
    };

    private static TicketHistoryDto ToDto(TicketHistoryRow history) => new()
    {
        Id = history.Id,
        UserName = PersonName.Format(history.UserFirstName, history.UserLastName) ?? string.Empty,
        Field = history.Field,
        OldValue = history.OldValue,
        NewValue = history.NewValue,
        CreatedAt = history.CreatedAt
    };
}
