namespace Sentinel.Domain.DTOs.Users;

public class UserDataExportDto
{
    public required DateTime ExportedAt { get; init; }
    public required UserExportProfileDto Profile { get; init; }
    public required IReadOnlyList<UserExportAuditLogDto> AuditLogs { get; init; }
}

public class UserExportProfileDto
{
    public required Guid Id { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Role { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime? LastLoginAt { get; init; }
    public required string Language { get; init; }
}

public class UserExportAuditLogDto
{
    public required Guid Id { get; init; }
    public required string Action { get; init; }
    public required string EntityType { get; init; }
    public required Guid? EntityId { get; init; }
    public required DateTime CreatedAt { get; init; }
}
