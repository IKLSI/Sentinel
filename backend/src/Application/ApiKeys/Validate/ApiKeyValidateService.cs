using Sentinel.Application.Abstractions;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.Validate;

public class ApiKeyValidateService(
    IApiKeyRepository apiKeyRepository,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope) : IService
{
    private static readonly TimeSpan LastUsedAtUpdateThreshold = TimeSpan.FromMinutes(1);

    public async Task<(ApiKey Key, User User)?> ExecuteAsync(string rawKey, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        ApiKey? apiKey = await apiKeyRepository
            .GetOrDefaultActiveByHashAcrossTenantsAsync(ApiKeyGenerator.Hash(rawKey), cancellationToken);

        if (apiKey == null) return null;
        if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < DateTime.UtcNow) return null;

        User user = apiKey.CreatedBy;

        if (!user.IsActive) return null;

        if (apiKey.LastUsedAt is null || DateTime.UtcNow - apiKey.LastUsedAt.Value > LastUsedAtUpdateThreshold)
        {
            using ICommitScope commitScope = commitScopeFactory.Begin();

            apiKey.LastUsedAt = DateTime.UtcNow;
            await commitScope.CommitAsync(cancellationToken);
        }

        return (apiKey, user);
    }
}
