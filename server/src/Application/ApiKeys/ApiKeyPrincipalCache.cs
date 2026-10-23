using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys;

public class ApiKeyPrincipalCache(IMemoryCache cache, IApiKeyRepository apiKeyRepository)
{
    public CachedApiKeyAuthentication? GetOrDefault(string keyHash) =>
        cache.TryGetValue(CacheKeys.ApiKeyPrincipal(keyHash), out CachedApiKeyAuthentication? cached) ? cached : null;

    public CachedApiKeyAuthentication Store(string keyHash, ApiKeyAuthenticationRow row)
    {
        CachedApiKeyAuthentication cached = new CachedApiKeyAuthentication(row);

        cache.Set(CacheKeys.ApiKeyPrincipal(keyHash), cached, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheKeys.ApiKeyPrincipalTtl,
            Priority = CacheItemPriority.High,
            Size = 1
        });

        return cached;
    }

    public void Invalidate(string keyHash) => cache.Remove(CacheKeys.ApiKeyPrincipal(keyHash));

    public async Task InvalidateForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        IReadOnlyList<string> keyHashes = await apiKeyRepository.ListKeyHashesForUserAsync(userId, cancellationToken);

        foreach (string keyHash in keyHashes)
        {
            Invalidate(keyHash);
        }
    }
}
