using Microsoft.AspNetCore.Http;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.Models;

namespace TMAflow.Application.Services;

public class AuditService
{
    private readonly TMAflowContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(TMAflowContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(Guid? userId, string action, string entityType, Guid? entityId = null, object? metadata = null)
    {
        string? ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        string? metadataJson = null;
        if (metadata != null)
        {
            metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata);
        }

        AuditLog auditLog = new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Metadata = metadataJson,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        };

        await _context.AuditLogs.AddAsync(auditLog);
        await _context.SaveChangesAsync();
    }
}
