using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Security;

public interface ITokenBlacklistService
{
    Task RevokeAsync(string jti, DateTime expiresAtUtc, CancellationToken cancellationToken);
    Task<bool> IsRevokedAsync(string jti, CancellationToken cancellationToken);
}

public class TokenBlacklistService : ITokenBlacklistService
{
    private readonly IRevokedTokenRepository _revokedTokenRepository;
    private readonly IMemoryCache _cache;

    public TokenBlacklistService(IRevokedTokenRepository revokedTokenRepository, IMemoryCache cache)
    {
        _revokedTokenRepository = revokedTokenRepository;
        _cache = cache;
    }

    public async Task RevokeAsync(string jti, DateTime expiresAtUtc, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(jti)) return;

        TimeSpan remainingLifetime = expiresAtUtc - DateTime.UtcNow;
        if (remainingLifetime <= TimeSpan.Zero) return;

        await _revokedTokenRepository.RevokeAsync(jti, expiresAtUtc, cancellationToken);

        _cache.Set(CacheKeys.RevokedToken(jti), true, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = remainingLifetime,
            Size = 1
        });
    }

    public async Task<bool> IsRevokedAsync(string jti, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(jti)) return false;

        string cacheKey = CacheKeys.RevokedToken(jti);

        if (_cache.TryGetValue(cacheKey, out bool cachedIsRevoked)) return cachedIsRevoked;

        bool isRevoked = await _revokedTokenRepository.ExistsByJtiAsync(jti, cancellationToken);

        _cache.Set(cacheKey, isRevoked, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = isRevoked
                ? CacheKeys.RevokedTokenTtl
                : CacheKeys.RevokedTokenNegativeTtl,
            Size = 1
        });

        return isRevoked;
    }
}
