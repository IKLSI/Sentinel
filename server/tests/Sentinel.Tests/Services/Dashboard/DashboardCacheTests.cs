using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Dashboard.GetStats;

namespace Sentinel.Tests.Services.Dashboard;

public class DashboardCacheTests
{
    private static readonly Guid OrganizationId = Guid.NewGuid();

    [Fact]
    public void Store_WhenNotInvalidatedMeanwhile_CachesTheStats()
    {
        DashboardCache cache = new(new MemoryCache(new MemoryCacheOptions()));
        long version = cache.VersionOf(OrganizationId);

        cache.Store(OrganizationId, version, new DashboardStatsDto());

        cache.TryGet(OrganizationId, out _).Should().BeTrue();
    }

    [Fact]
    public void Store_WhenInvalidatedDuringTheBuild_DiscardsTheStaleStats()
    {
        DashboardCache cache = new(new MemoryCache(new MemoryCacheOptions()));
        long version = cache.VersionOf(OrganizationId);

        cache.Invalidate(OrganizationId);
        cache.Store(OrganizationId, version, new DashboardStatsDto());

        cache.TryGet(OrganizationId, out _).Should().BeFalse();
    }
}
