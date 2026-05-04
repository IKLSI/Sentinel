using Microsoft.Extensions.Logging;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

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

public class AuditLogService : IAuditLogService
{
    private readonly SentinelContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(SentinelContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(
        AuditAction action,
        string entityType,
        Guid? organizationId = null,
        Guid? userId = null,
        Guid? entityId = null,
        string? jti = null)
    {
        try
        {
            _context.AuditLogs.Add(new AuditLog
            {
                OrganizationId = organizationId,
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Jti = jti,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Échec de l'audit log pour l'action {Action} sur {EntityType}", action, entityType);
        }
    }
}
