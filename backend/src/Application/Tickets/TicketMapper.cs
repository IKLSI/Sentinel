using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Tickets;

public static class TicketMapper
{
    public static TicketDto ToDto(Ticket ticket) => new()
    {
        Id = ticket.Id,
        ProjectId = ticket.ProjectId,
        ProjectName = ticket.Project?.Name,
        Title = ticket.Title,
        Description = ticket.Description,
        Priority = ticket.Priority.ToString().ToLower(),
        Type = ticket.Type.ToString().ToLower(),
        Status = ticket.Status.ToString().ToLower(),
        AssignedToId = ticket.AssignedToId,
        AssignedToName = ticket.AssignedTo?.FullName,
        EstimatedHours = ticket.EstimatedHours,
        CreatedByName = ticket.CreatedBy?.FullName ?? string.Empty,
        CreatedAt = ticket.CreatedAt,
        UpdatedAt = ticket.UpdatedAt,
        Comments = ticket.Comments?.Select(ToDto).OrderBy(c => c.CreatedAt).ToList() ?? [],
        History = ticket.History?.Select(ToDto).OrderByDescending(h => h.CreatedAt).ToList() ?? []
    };

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
        UserId = history.UserId,
        UserName = history.User?.FullName ?? string.Empty,
        Field = history.Field,
        OldValue = history.OldValue,
        NewValue = history.NewValue,
        CreatedAt = history.CreatedAt
    };
}
