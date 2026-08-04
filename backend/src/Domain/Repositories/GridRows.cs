using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record TicketGridRow(
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
    decimal? EstimatedHours,
    string? CreatedByFirstName,
    string? CreatedByLastName,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserGridRow(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    ThemeType Theme,
    string Language);
