using System.Text.Json;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Notifications;

public class NotificationPublisher(
    INotificationRepository notificationRepository,
    IUnitOfWorkManager unitOfWorkManager,
    INotificationPusher? pusher = null)
{

    public async Task PublishAsync(
        Guid userId,
        Guid organizationId,
        NotificationType type,
        string messageKey,
        IReadOnlyDictionary<string, string>? messageParams,
        Guid? ticketId,
        CancellationToken cancellationToken)
    {
        Notification notification = new Notification
        {
            UserId = userId,
            OrganizationId = organizationId,
            Type = type,
            MessageKey = messageKey,
            MessageParams = messageParams == null ? null : JsonSerializer.Serialize(messageParams),
            TicketId = ticketId
        };

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            await notificationRepository.AddAsync(notification, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
        }

        if (pusher is not null)
        {
            await pusher.PushAsync(userId, type, messageKey, messageParams, ticketId,
                notification.Id, notification.CreatedAt);
        }
    }
}
