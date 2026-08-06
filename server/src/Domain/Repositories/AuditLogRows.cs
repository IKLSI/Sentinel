namespace Sentinel.Domain.Repositories;

public sealed record UserExportAuditLogRow(
    Guid Id,
    string Action,
    string EntityType,
    Guid? EntityId,
    DateTime CreatedAt);
