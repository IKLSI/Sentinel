using Microsoft.AspNetCore.SignalR;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.API.Realtime;

public class SignalRRealtimeNotifier(
    IHubContext<SentinelHub> hubContext,
    ILogger<SignalRRealtimeNotifier> logger) : IRealtimeNotifier
{
    public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification,
        CancellationToken cancellationToken) =>
        SendAsync(hubContext.Clients.Group(RealtimeConstants.OrganizationGroup(organizationId)),
            notification, organizationId, cancellationToken);

    public Task NotifyAllAsync(RealtimeEvent notification, CancellationToken cancellationToken) =>
        SendAsync(hubContext.Clients.All, notification, organizationId: null, cancellationToken);

    private async Task SendAsync(IClientProxy clients, RealtimeEvent notification, Guid? organizationId,
        CancellationToken cancellationToken)
    {
        try
        {
            await clients.SendAsync(RealtimeConstants.InvalidateMethod, notification, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Unable to broadcast {Resource} to organization {OrganizationId}",
                notification.Resource, organizationId);
        }
    }
}
