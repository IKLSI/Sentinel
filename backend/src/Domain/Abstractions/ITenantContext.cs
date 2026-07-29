namespace Sentinel.Domain.Abstractions;

public interface ITenantContext
{
    Guid? OrganizationId { get; }
    Guid? UserId { get; }
    string? Jti { get; }
    DateTime? TokenExpiresAtUtc { get; }
    bool IsSet { get; }
}
