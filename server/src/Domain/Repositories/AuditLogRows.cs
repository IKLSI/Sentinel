namespace Sentinel.Domain.Repositories;

public sealed record ComplianceAuditLogRow(
    string Action,
    DateTime CreatedAt,
    string? UserFirstName,
    string? UserLastName,
    string? UserEmail);
