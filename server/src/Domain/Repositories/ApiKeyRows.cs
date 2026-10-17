using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record ApiKeyListRow(
    Guid Id,
    string Name,
    string Prefix,
    DateTime? ExpiresAt,
    DateTime? LastUsedAt,
    DateTime CreatedAt,
    string CreatedByName);

public sealed record ApiKeyAuthenticationRow(
    Guid ApiKeyId,
    DateTime? ExpiresAt,
    DateTime? LastUsedAt,
    Guid UserId,
    string Email,
    UserRole Role,
    UserAccessStatus AccessStatus,
    Guid OrganizationId);
