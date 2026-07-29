using System.Text.Json;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Notifications;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Notifications.GetAll;

public class NotificationListService(INotificationRepository notificationRepository, ITenantContext tenant) : IService
{
    private const int MaxItems = 30;

    public async Task<Result<NotificationsResponse>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid userId)
            return Result<NotificationsResponse>.Unauthorized();

        IReadOnlyList<Notification> notifications = await notificationRepository
            .ListRecentForUserAsync(userId, MaxItems, cancellationToken);

        List<NotificationDto> items = notifications.Select(n => new NotificationDto(
            n.Id,
            n.Type.ToString(),
            n.MessageKey,
            DeserializeParams(n.MessageParams),
            n.TicketId,
            n.IsRead,
            n.CreatedAt
        )).ToList();

        return new NotificationsResponse(items, notifications.Count(n => !n.IsRead));
    }

    private static IReadOnlyDictionary<string, string>? DeserializeParams(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;

        return JsonSerializer.Deserialize<Dictionary<string, string>>(json);
    }
}
