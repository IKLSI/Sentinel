namespace Sentinel.Domain.Repositories;

public sealed record UrgentTicketRow(
    Guid Id,
    int Number,
    string Title,
    string Priority,
    string Type,
    string? ProjectName,
    string? AssignedToName,
    int CommentCount);

public sealed record ClosedTicketActivityRow(
    Guid Id,
    int Number,
    DateTime UpdatedAt,
    string? ProjectName,
    string? AssigneeFirstName,
    string? AssigneeLastName,
    string? CreatedByFirstName,
    string? CreatedByLastName);

public sealed record CreatedTicketActivityRow(
    Guid Id,
    int Number,
    DateTime CreatedAt,
    string? ProjectName,
    string? CreatedByFirstName,
    string? CreatedByLastName);

public sealed record VulnerabilityActivityRow(
    DateTime DetectedAt,
    string CveId,
    decimal CvssScore,
    string ProjectName,
    Guid ProjectId);
