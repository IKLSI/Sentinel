namespace Sentinel.Domain.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    string Type,
    string MessageKey,
    IReadOnlyDictionary<string, string>? MessageParams,
    Guid? TicketId,
    bool IsRead,
    DateTime CreatedAt
);

public record NotificationsResponse(
    List<NotificationDto> Items,
    int UnreadCount
);
