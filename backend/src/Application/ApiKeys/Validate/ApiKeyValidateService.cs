using Sentinel.Application.Abstractions;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.Validate;

public class ApiKeyValidateService(
    IApiKeyRepository apiKeyRepository,
    IUnitOfWorkManager unitOfWorkManager,
    ISystemScope systemScope) : IService
{

    public async Task<(ApiKey Key, User User)?> ExecuteAsync(string rawKey, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        ApiKey? apiKey = await apiKeyRepository
            .GetOrDefaultActiveByHashAcrossTenantsAsync(ApiKeyGenerator.Hash(rawKey), cancellationToken);

        if (apiKey == null) return null;
        if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < DateTime.UtcNow) return null;

        User user = apiKey.CreatedBy;

        if (!user.IsActive) return null;

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            apiKey.LastUsedAt = DateTime.UtcNow;
            await unitOfWork.CommitAsync(cancellationToken);
        }

        return (apiKey, user);
    }
}
