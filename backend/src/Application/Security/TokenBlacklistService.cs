using Microsoft.Extensions.Caching.Memory;

namespace Sentinel.Application.Security;

public interface ITokenBlacklistService
{
    void Revoke(string jti, DateTime expiresAtUtc);
    bool IsRevoked(string jti);
}

public class TokenBlacklistService : ITokenBlacklistService
{
    private readonly IMemoryCache _cache;
    private const string Prefix = "revoked-jti:";

    public TokenBlacklistService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void Revoke(string jti, DateTime expiresAtUtc)
    {
        if (string.IsNullOrEmpty(jti)) return;
        TimeSpan ttl = expiresAtUtc - DateTime.UtcNow;
        if (ttl <= TimeSpan.Zero) return;
        _cache.Set(Prefix + jti, true, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl, Size = 1 });
    }

    public bool IsRevoked(string jti)
    {
        if (string.IsNullOrEmpty(jti)) return false;
        return _cache.TryGetValue(Prefix + jti, out _);
    }
}
