using Microsoft.AspNetCore.SignalR;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.API.Realtime;

public class SignalRRealtimeNotifier(
    IHubContext<SentinelHub> hubContext,
    ILogger<SignalRRealtimeNotifier> logger) : IRealtimeNotifier
{
    public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification) =>
        SendAsync(hubContext.Clients.Group(RealtimeConstants.OrganizationGroup(organizationId)),
            notification, organizationId);

    public Task NotifyAllAsync(RealtimeEvent notification) =>
        SendAsync(hubContext.Clients.All, notification, organizationId: null);

    private async Task SendAsync(IClientProxy clients, RealtimeEvent notification, Guid? organizationId)
    {
        try
        {
            await clients.SendAsync(RealtimeConstants.InvalidateMethod, notification, CancellationToken.None);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Unable to broadcast {Resource} to organization {OrganizationId}",
                notification.Resource, organizationId);
        }
    }
}
