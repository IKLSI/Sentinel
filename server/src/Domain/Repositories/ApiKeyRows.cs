namespace Sentinel.Domain.Repositories;

public sealed record ApiKeyListRow(
    Guid Id,
    string Name,
    string Prefix,
    DateTime? ExpiresAt,
    DateTime? LastUsedAt,
    DateTime CreatedAt,
    string CreatedByName);
