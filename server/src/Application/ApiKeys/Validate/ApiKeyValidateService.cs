using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.Validate;

public class ApiKeyValidateService(
    IApiKeyRepository apiKeyRepository,
    ApiKeyPrincipalCache principalCache,
    ISystemScope systemScope) : IService
{
    private static readonly TimeSpan LastUsedAtUpdateThreshold = TimeSpan.FromMinutes(1);

    public async Task<Result<ApiKeyPrincipalDto>> ExecuteAsync(string rawKey, CancellationToken cancellationToken)
    {
        string keyHash = ApiKeyGenerator.Hash(rawKey);

        using IDisposable elevation = systemScope.Enter();

        CachedApiKeyAuthentication? cached = principalCache.GetOrDefault(keyHash);

        if (cached == null)
        {
            ApiKeyAuthenticationRow? row = await apiKeyRepository
                .GetOrDefaultActiveAuthenticationByHashAcrossTenantsAsync(keyHash, cancellationToken);

            if (row == null || row.AccessStatus != UserAccessStatus.Active)
                return Result<ApiKeyPrincipalDto>.Unauthorized();

            cached = principalCache.Store(keyHash, row);
        }

        ApiKeyAuthenticationRow apiKey = cached.Row;
        DateTime now = DateTime.UtcNow;

        if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < now)
            return Result<ApiKeyPrincipalDto>.Unauthorized();

        if (cached.TryClaimLastUsedAtUpdate(now, LastUsedAtUpdateThreshold))
        {
            await apiKeyRepository.UpdateLastUsedAtAcrossTenantsAsync(apiKey.ApiKeyId, now,
                now - LastUsedAtUpdateThreshold, cancellationToken);
        }

        return new ApiKeyPrincipalDto
        {
            ApiKeyId = apiKey.ApiKeyId,
            UserId = apiKey.UserId,
            Email = apiKey.Email,
            Role = apiKey.Role.ToString(),
            OrganizationId = apiKey.OrganizationId
        };
    }
}
