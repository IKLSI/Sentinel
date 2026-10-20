using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Dashboard;

public class DashboardCache(IMemoryCache cache)
{
    public void Invalidate(Guid organizationId)
    {
        foreach (DashboardPeriod period in Enum.GetValues<DashboardPeriod>())
            cache.Remove(CacheKeys.Dashboard(organizationId, (int)period));
    }
}
