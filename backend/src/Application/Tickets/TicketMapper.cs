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
        StatusId = ticket.TicketStatusId?.ToString() ?? string.Empty,
        StatusName = ticket.TicketStatus?.Name ?? string.Empty,
        StatusColor = ticket.TicketStatus?.Color ?? string.Empty,
        StatusIsClosed = ticket.TicketStatus?.IsClosed ?? false,
        AssignedToId = ticket.AssignedToId,
        AssignedToName = ticket.AssignedTo?.FullName,
        EstimatedHours = ticket.EstimatedHours,
        CreatedById = ticket.CreatedById,
        CreatedByName = ticket.CreatedBy?.FullName ?? string.Empty,
        CreatedAt = ticket.CreatedAt,
        UpdatedAt = ticket.UpdatedAt,
        Tags = ticket.GetTags().ToList(),
        Comments = ticket.Comments?.Select(ToDto).OrderBy(c => c.CreatedAt).ToList() ?? [],
        History = ticket.History?.Select(ToDto).OrderByDescending(h => h.CreatedAt).ToList() ?? []
    };

    public static TicketCommentDto ToDto(TicketComment comment) => new()
    {
        Id = comment.Id,
        AuthorId = comment.AuthorId,
        AuthorName = comment.Author?.FullName ?? string.Empty,
        Content = comment.Content,
        CreatedAt = comment.CreatedAt,
        UpdatedAt = comment.UpdatedAt
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
