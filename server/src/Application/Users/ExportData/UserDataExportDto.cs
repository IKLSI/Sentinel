namespace Sentinel.Application.Users.ExportData;

public sealed record UserDataExportDto
{
    public required DateTime ExportedAt { get; init; }
    public required UserExportProfileDto Profile { get; init; }
    public required IReadOnlyList<UserExportTicketDto> Tickets { get; init; }
    public required IReadOnlyList<UserExportCommentDto> Comments { get; init; }
    public required IReadOnlyList<UserExportAttachmentDto> Attachments { get; init; }
    public required IReadOnlyList<UserExportAuditLogDto> AuditLogs { get; init; }
    public required UserExportTruncationDto Truncated { get; init; }
}

public sealed record UserExportProfileDto
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

public sealed record UserExportTicketDto
{
    public required Guid Id { get; init; }
    public required int Number { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Status { get; init; }
    public required string Priority { get; init; }
    public required string Type { get; init; }
    public required string? ProjectName { get; init; }
    public required bool IsCreator { get; init; }
    public required bool IsAssignee { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}

public sealed record UserExportCommentDto
{
    public required Guid Id { get; init; }
    public required Guid TicketId { get; init; }
    public required int TicketNumber { get; init; }
    public required string Content { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}

public sealed record UserExportAttachmentDto
{
    public required Guid Id { get; init; }
    public required Guid TicketId { get; init; }
    public required int TicketNumber { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long SizeBytes { get; init; }
    public required DateTime CreatedAt { get; init; }
    public string? ArchivePath { get; init; }
}

public sealed record UserExportAuditLogDto
{
    public required Guid Id { get; init; }
    public required string Action { get; init; }
    public required string EntityType { get; init; }
    public required Guid? EntityId { get; init; }
    public required DateTime CreatedAt { get; init; }
}

public sealed record UserExportTruncationDto
{
    public required int MaxRowsPerCollection { get; init; }
    public required bool Tickets { get; init; }
    public required bool Comments { get; init; }
    public required bool Attachments { get; init; }
    public required bool AuditLogs { get; init; }
    public bool AttachmentFiles { get; init; }
    public required long MaxAttachmentBytes { get; init; }
}
