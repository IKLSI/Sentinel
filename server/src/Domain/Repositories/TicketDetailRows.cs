using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record TicketDetailRow(
    Guid Id,
    int Number,
    Guid? ProjectId,
    string? ProjectName,
    string Title,
    string Description,
    TicketPriority Priority,
    TicketType Type,
    TicketStatus Status,
    Guid? AssignedToId,
    string? AssignedToFirstName,
    string? AssignedToLastName,
    string? CreatedByFirstName,
    string? CreatedByLastName,
    DateTime CreatedAt,
    FindingKind? FindingKind,
    string? FindingKey,
    IReadOnlyList<TicketCommentRow> Comments,
    IReadOnlyList<TicketHistoryRow> History);

public sealed record TicketCommentRow(
    Guid Id,
    Guid AuthorId,
    string AuthorFirstName,
    string AuthorLastName,
    string Content,
    DateTime CreatedAt);

public sealed record TicketHistoryRow(
    Guid Id,
    string? UserFirstName,
    string? UserLastName,
    string Field,
    string? OldValue,
    string? NewValue,
    DateTime CreatedAt);
