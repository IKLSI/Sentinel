using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Realtime;

[Authorize]
public class SentinelHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (ResolveOrganizationId() is not { } organizationId)
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeConstants.OrganizationGroup(organizationId));
        await base.OnConnectedAsync();
    }

    private Guid? ResolveOrganizationId() =>
        Guid.TryParse(Context.User?.FindFirst(ClaimNames.OrganizationId)?.Value, out Guid organizationId)
            ? organizationId
            : null;
}
