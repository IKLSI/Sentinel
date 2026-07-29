using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Hubs;

[Authorize]
public class NotificationHub : Hub;

public class NotificationUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
        => connection.User.FindFirst(ClaimNames.UserId)?.Value;
}
