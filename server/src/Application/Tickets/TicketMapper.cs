using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets;

public static class TicketMapper
{
    public static TicketDto ToDto(Ticket ticket) => new()
    {
        Id = ticket.Id,
        Reference = TicketReference.For(ticket.Number),
        ProjectId = ticket.ProjectId,
        ProjectName = ticket.Project?.Name,
        Title = ticket.Title,
        Description = ticket.Description,
        Priority = ticket.Priority.ToString().ToLower(),
        Type = ticket.Type.ToString().ToLower(),
        Status = ticket.Status.ToString().ToLower(),
        AssignedToId = ticket.AssignedToId,
        AssignedToName = ticket.AssignedTo?.FullName,
        CreatedByName = ticket.CreatedBy?.FullName ?? string.Empty,
        CreatedAt = ticket.CreatedAt,
        CommentCount = ticket.Comments?.Count ?? 0,
        Comments = ticket.Comments?.Select(ToDto).OrderBy(c => c.CreatedAt).ToList() ?? [],
        History = ticket.History?.Select(ToDto).OrderByDescending(h => h.CreatedAt).ToList() ?? []
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
        AssignedToName = FullName(row.AssignedToFirstName, row.AssignedToLastName),
        CreatedByName = FullName(row.CreatedByFirstName, row.CreatedByLastName) ?? string.Empty,
        CreatedAt = row.CreatedAt,
        CommentCount = row.CommentCount
    };

    private static string? FullName(string? firstName, string? lastName) =>
        firstName == null && lastName == null ? null : $"{firstName} {lastName}".Trim();

    public static TicketCommentDto ToDto(TicketComment comment) => new()
    {
        Id = comment.Id,
        AuthorId = comment.AuthorId,
        AuthorName = comment.Author?.FullName ?? string.Empty,
        Content = comment.Content,
        CreatedAt = comment.CreatedAt
    };

    public static TicketHistoryDto ToDto(TicketHistory history) => new()
    {
        Id = history.Id,
        UserName = history.User?.FullName ?? string.Empty,
        Field = history.Field,
        OldValue = history.OldValue,
        NewValue = history.NewValue,
        CreatedAt = history.CreatedAt
    };
}
