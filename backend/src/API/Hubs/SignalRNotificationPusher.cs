using Microsoft.AspNetCore.SignalR;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Models;

namespace Sentinel.API.Hubs;

public class SignalRNotificationPusher : INotificationPusher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationPusher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PushAsync(Guid userId, NotificationType type, string messageKey,
        IReadOnlyDictionary<string, string>? messageParams, Guid? ticketId, Guid notificationId, DateTime createdAt)
        => _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new
        {
            id = notificationId,
            type = type.ToString(),
            messageKey,
            messageParams,
            ticketId,
            isRead = false,
            createdAt
        });
}
