using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record UserExportAuditLogRow(
    Guid Id,
    string Action,
    string EntityType,
    Guid? EntityId,
    DateTime CreatedAt);

public sealed record UserExportTicketRow(
    Guid Id,
    int Number,
    string Title,
    string Description,
    TicketStatus Status,
    TicketPriority Priority,
    TicketType Type,
    string? ProjectName,
    bool IsCreator,
    bool IsAssignee,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserExportTicketCommentRow(
    Guid Id,
    Guid TicketId,
    int TicketNumber,
    string Content,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserExportTicketAttachmentRow(
    Guid Id,
    Guid TicketId,
    int TicketNumber,
    string FileName,
    string ContentType,
    DateTime CreatedAt);
