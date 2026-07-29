using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.Revoke;

public class ApiKeyRevokeService(
    IApiKeyRepository apiKeyRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(Guid apiKeyId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result.Unauthorized();

        ApiKey? apiKey = await apiKeyRepository
            .GetOrDefaultActiveInOrganizationAsync(apiKeyId, organizationId, cancellationToken);

        if (apiKey == null)
            return Result.NotFound();

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            apiKey.IsRevoked = true;
            await commitScope.CommitAsync(cancellationToken);
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
