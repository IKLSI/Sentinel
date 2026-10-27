using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.Application.Dashboard;

public class DashboardInvalidatingNotifier(IRealtimeNotifier inner, DashboardCache dashboardCache) : IRealtimeNotifier
{
    private static readonly HashSet<string> DashboardResources = new(StringComparer.Ordinal)
    {
        RealtimeResources.Projects,
        RealtimeResources.Project,
        RealtimeResources.Tickets,
        RealtimeResources.Ticket,
        RealtimeResources.TicketActivity,
        RealtimeResources.Users
    };

    public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification)
    {
        if (DashboardResources.Contains(notification.Resource)) dashboardCache.Invalidate(organizationId);

        return inner.NotifyOrganizationAsync(organizationId, notification);
    }

    public Task NotifyAllAsync(RealtimeEvent notification) => inner.NotifyAllAsync(notification);
}
