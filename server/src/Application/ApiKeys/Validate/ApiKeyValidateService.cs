using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.Validate;

public class ApiKeyValidateService(
    IApiKeyRepository apiKeyRepository,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope) : IService
{
    private static readonly TimeSpan LastUsedAtUpdateThreshold = TimeSpan.FromMinutes(1);

    public async Task<Result<ApiKeyPrincipalDto>> ExecuteAsync(string rawKey, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        ApiKey? apiKey = await apiKeyRepository
            .GetOrDefaultActiveByHashAcrossTenantsAsync(ApiKeyGenerator.Hash(rawKey), cancellationToken);

        if (apiKey == null)
            return Result<ApiKeyPrincipalDto>.Unauthorized();

        if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < DateTime.UtcNow)
            return Result<ApiKeyPrincipalDto>.Unauthorized();

        User user = apiKey.CreatedBy;

        if (user.AccessStatus != UserAccessStatus.Active)
            return Result<ApiKeyPrincipalDto>.Unauthorized();

        if (apiKey.LastUsedAt is null || DateTime.UtcNow - apiKey.LastUsedAt.Value > LastUsedAtUpdateThreshold)
        {
            using ICommitScope commitScope = commitScopeFactory.Begin();

            apiKey.LastUsedAt = DateTime.UtcNow;
            await commitScope.CommitAsync(cancellationToken);
        }

        return new ApiKeyPrincipalDto
        {
            ApiKeyId = apiKey.Id,
            UserId = user.Id,
            Email = user.Email,
            Role = user.Role.ToString(),
            OrganizationId = user.OrganizationId
        };
    }
}
