namespace Sentinel.Domain.Repositories;

public sealed record UrgentTicketRow(
    Guid Id,
    string Title,
    string Priority,
    string Type,
    string? ProjectName,
    string? AssignedToName,
    int CommentCount);

public sealed record ClosedTicketActivityRow(
    Guid Id,
    DateTime UpdatedAt,
    string? ProjectName,
    string? AssigneeFirstName,
    string? AssigneeLastName,
    string? CreatedByFirstName,
    string? CreatedByLastName);

public sealed record CreatedTicketActivityRow(
    Guid Id,
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
