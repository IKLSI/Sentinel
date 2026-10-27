using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services.Dashboard;

public class DashboardInvalidatingNotifierTests
{
    private static readonly Guid OrganizationId = Guid.NewGuid();

    [Theory]
    [InlineData(RealtimeResources.Projects)]
    [InlineData(RealtimeResources.Project)]
    [InlineData(RealtimeResources.Tickets)]
    [InlineData(RealtimeResources.Ticket)]
    [InlineData(RealtimeResources.TicketActivity)]
    [InlineData(RealtimeResources.Users)]
    public async Task NotifyOrganizationAsync_ResourceShownOnTheDashboard_InvalidatesTheCachedStats(string resource)
    {
        DashboardCache cache = CacheWithStats();

        await new DashboardInvalidatingNotifier(new NoopRealtimeNotifier(), cache)
            .NotifyOrganizationAsync(OrganizationId, new RealtimeEvent(resource));

        cache.TryGet(OrganizationId, out _).Should().BeFalse();
    }

    [Theory]
    [InlineData(RealtimeResources.ScanProgress)]
    [InlineData(RealtimeResources.ApiKeys)]
    [InlineData(RealtimeResources.Integrations)]
    public async Task NotifyOrganizationAsync_ResourceAbsentFromTheDashboard_KeepsTheCachedStats(string resource)
    {
        DashboardCache cache = CacheWithStats();

        await new DashboardInvalidatingNotifier(new NoopRealtimeNotifier(), cache)
            .NotifyOrganizationAsync(OrganizationId, new RealtimeEvent(resource));

        cache.TryGet(OrganizationId, out _).Should().BeTrue();
    }

    private static DashboardCache CacheWithStats()
    {
        DashboardCache cache = new(new MemoryCache(new MemoryCacheOptions()));
        cache.Store(OrganizationId, cache.VersionOf(OrganizationId), new DashboardStatsDto());
        return cache;
    }
}
