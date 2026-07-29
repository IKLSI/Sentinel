using Sentinel.Domain.Models;

namespace Sentinel.Application.Notifications;

public interface INotificationPusher
{
    Task PushAsync(Guid userId, NotificationType type, string messageKey,
        IReadOnlyDictionary<string, string>? messageParams, Guid? ticketId, Guid notificationId, DateTime createdAt);
}
