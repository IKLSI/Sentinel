namespace Sentinel.Domain.Abstractions;

public interface ITenantContext
{
    Guid? OrganizationId { get; }
    Guid? UserId { get; }
    string? Jti { get; }
    bool IsSet { get; }

    void Reset();
}
