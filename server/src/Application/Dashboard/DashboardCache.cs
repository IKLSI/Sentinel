using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Dashboard;

public class DashboardCache(IMemoryCache cache)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    private readonly ConcurrentDictionary<Guid, long> _versions = new();
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _buildGates = new();

    public SemaphoreSlim BuildGateOf(Guid organizationId) => _buildGates.GetOrAdd(organizationId, _ => new SemaphoreSlim(1, 1));

    public bool TryGet(Guid organizationId, out DashboardStatsDto? stats) =>
        cache.TryGetValue(CacheKeys.Dashboard(organizationId), out stats) && stats != null;

    public long VersionOf(Guid organizationId) => _versions.GetValueOrDefault(organizationId);

    public void Store(Guid organizationId, long version, DashboardStatsDto stats)
    {
        MemoryCacheEntryOptions options = new()
        {
            AbsoluteExpirationRelativeToNow = Lifetime,
            Priority = CacheItemPriority.High,
            Size = 1
        };

        lock (_versions)
        {
            if (VersionOf(organizationId) != version) return;

            cache.Set(CacheKeys.Dashboard(organizationId), stats, options);
        }
    }

    public void Invalidate(Guid organizationId)
    {
        lock (_versions)
        {
            _versions.AddOrUpdate(organizationId, 1, (_, version) => version + 1);

            cache.Remove(CacheKeys.Dashboard(organizationId));
        }
    }
}
