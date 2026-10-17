using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys;

public sealed class CachedApiKeyAuthentication(ApiKeyAuthenticationRow row)
{
    private long _lastUsedAtTicks = row.LastUsedAt?.Ticks ?? 0;

    public ApiKeyAuthenticationRow Row { get; } = row;

    public bool TryClaimLastUsedAtUpdate(DateTime now, TimeSpan threshold)
    {
        long observed = Interlocked.Read(ref _lastUsedAtTicks);

        if (observed != 0 && now - new DateTime(observed, DateTimeKind.Utc) <= threshold) return false;

        return Interlocked.CompareExchange(ref _lastUsedAtTicks, now.Ticks, observed) == observed;
    }
}
