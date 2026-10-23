using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.ApiKeys;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Security;

public class UserSessionCache(IMemoryCache cache, ApiKeyPrincipalCache apiKeyPrincipalCache)
{
    public async Task InvalidateAsync(Guid userId, CancellationToken cancellationToken)
    {
        cache.Remove(CacheKeys.AuthAccount(userId));
        await apiKeyPrincipalCache.InvalidateForUserAsync(userId, cancellationToken);
    }
}
