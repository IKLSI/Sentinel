using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Dashboard;

public class DashboardCache(IMemoryCache cache)
{

    public void Invalidate(Guid organizationId) => cache.Remove(CacheKeys.Dashboard(organizationId));
}
