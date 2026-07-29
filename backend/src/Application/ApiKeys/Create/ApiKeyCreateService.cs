using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.ApiKeys;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.Create;

public class ApiKeyCreateService(
    IApiKeyRepository apiKeyRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    ITenantContext tenant,
    ApiKeyCreateValidator validator) : IService
{
    public async Task<Result<CreatedApiKeyDto>> ExecuteAsync(CreateApiKeyDto model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<CreatedApiKeyDto>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<CreatedApiKeyDto>.From(validationResult);

        (string rawKey, string keyHash, string displayPrefix) = ApiKeyGenerator.Generate();

        ApiKey apiKey = new ApiKey
        {
            OrganizationId = organizationId,
            CreatedById = userId,
            Name = model.Name.Trim(),
            KeyHash = keyHash,
            Prefix = displayPrefix,
            ExpiresAt = model.ExpiresAt.HasValue
                ? DateTime.SpecifyKind(model.ExpiresAt.Value, DateTimeKind.Utc)
                : null,
        };

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await apiKeyRepository.AddAsync(apiKey, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.ApiKeyCreated,
            entityType: AuditEntityTypes.ApiKey,
            organizationId: organizationId,
            userId: userId,
            entityId: apiKey.Id,
            jti: tenant.Jti);

        return new CreatedApiKeyDto
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            Prefix = apiKey.Prefix,
            Key = rawKey,
            ExpiresAt = apiKey.ExpiresAt,
            CreatedAt = apiKey.CreatedAt,
        };
    }
}
