using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.Revoke;

public class ApiKeyRevokeService(
    IApiKeyRepository apiKeyRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{

    public async Task<Result> ExecuteAsync(Guid apiKeyId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result.Unauthorized();

        ApiKey? apiKey = await apiKeyRepository
            .GetByOrganization(organizationId, QueryableQueryOptions.Tracked)
            .FirstOrDefaultAsync(k => k.Id == apiKeyId && !k.IsRevoked, cancellationToken);

        if (apiKey == null)
            return Result.NotFound();

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            apiKey.IsRevoked = true;
            await unitOfWork.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.ApiKeyRevoked,
            entityType: AuditEntityTypes.ApiKey,
            organizationId: organizationId,
            userId: userId,
            entityId: apiKeyId,
            jti: tenant.Jti);

        return Result.NoContent();
    }
}
