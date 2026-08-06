using Sentinel.Domain.Entities;

namespace Sentinel.Application.Audit;

public interface IAuditLogService
{
    Task LogAsync(
        AuditAction action,
        string entityType,
        Guid? organizationId = null,
        Guid? userId = null,
        Guid? entityId = null,
        string? jti = null);
}

public class AuditLogService(AuditLogQueue queue) : IAuditLogService
{
    public Task LogAsync(
        AuditAction action,
        string entityType,
        Guid? organizationId = null,
        Guid? userId = null,
        Guid? entityId = null,
        string? jti = null)
    {
        queue.Enqueue(new AuditLog
        {
            OrganizationId = organizationId,
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Jti = jti,
            CreatedAt = DateTime.UtcNow
        });

        return Task.CompletedTask;
    }
}
