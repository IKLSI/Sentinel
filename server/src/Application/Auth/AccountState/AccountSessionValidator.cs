using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.AccountState;

public class AccountSessionValidator(IUserRepository userRepository, ISystemScope systemScope, IMemoryCache cache)
{
    public async Task<bool> IsSessionValidAsync(Guid userId, int tokenVersion, CancellationToken cancellationToken)
    {
        UserAccountStateRow? account = await GetAccountStateAsync(userId, cancellationToken);

        return account is { AccessStatus: UserAccessStatus.Active } && account.TokenVersion == tokenVersion;
    }

    private async Task<UserAccountStateRow?> GetAccountStateAsync(Guid userId, CancellationToken cancellationToken)
    {
        string cacheKey = CacheKeys.AuthAccount(userId);

        if (cache.TryGetValue(cacheKey, out UserAccountStateRow? cached)) return cached;

        UserAccountStateRow? account;

        using (systemScope.Enter())
        {
            account = await userRepository.GetAccountStateOrDefaultAsync(userId, cancellationToken);
        }

        if (account == null) return null;

        cache.Set(cacheKey, account, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheKeys.AuthAccountTtl,
            Size = 1
        });

        return account;
    }
}
