using Sentinel.Domain.Abstractions;

namespace Sentinel.Tests.Helpers;

public class FakeTenantContext : ITenantContext
{
    public Guid? OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public string? Jti { get; set; }
    public bool IsSet => OrganizationId.HasValue;

    public void Reset() { }
}

public class FakeSystemScope : ISystemScope
{
    private sealed class NoopScope : IDisposable
    {
        public void Dispose() { }
    }

    public bool IsActive => false;

    public IDisposable Enter() => new NoopScope();
}

public class FakeAuditLogService : Sentinel.Application.Audit.IAuditLogService
{
    public Task LogAsync(
        Sentinel.Domain.Entities.AuditAction action,
        string entityType,
        Guid? organizationId = null,
        Guid? userId = null,
        Guid? entityId = null,
        string? jti = null) => Task.CompletedTask;
}
