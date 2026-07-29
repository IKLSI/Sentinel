using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public interface INotificationPusher
{
    Task PushAsync(Guid userId, NotificationType type, string message, Guid? ticketId, Guid notificationId, DateTime createdAt);
}
