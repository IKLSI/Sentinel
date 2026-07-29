using Microsoft.AspNetCore.SignalR;
using Sentinel.Application.Services;
using Sentinel.Domain.Models;

namespace Sentinel.API.Hubs;

public class SignalRNotificationPusher : INotificationPusher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationPusher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PushAsync(Guid userId, NotificationType type, string message, Guid? ticketId, Guid notificationId, DateTime createdAt)
        => _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new
        {
            id = notificationId,
            type = type.ToString(),
            message,
            ticketId,
            isRead = false,
            createdAt
        });
}
