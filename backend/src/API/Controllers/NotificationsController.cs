using System.Text.Json;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.Services;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/notifications")]
[Route("api/v{version:apiVersion}/notifications")]
[Authorize]
public class NotificationsController : BaseController
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<NotificationsResponse>> GetNotifications()
    {
        Guid? userId = GetCurrentUserId();

        if (userId is null) return Unauthorized();

        List<Notification> notifications = await _notificationService.GetForUserAsync(userId.Value);
        int unreadCount = notifications.Count(n => !n.IsRead);

        return Ok(new NotificationsResponse(
            notifications.Select(n => new NotificationDto(
                n.Id,
                n.Type.ToString(),
                n.MessageKey,
                DeserializeParams(n.MessageParams),
                n.TicketId,
                n.IsRead,
                n.CreatedAt
            )).ToList(),
            unreadCount
        ));
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        Guid? userId = GetCurrentUserId();

        if (userId is null) return Unauthorized();

        await _notificationService.MarkReadAsync(id, userId.Value);
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        Guid? userId = GetCurrentUserId();

        if (userId is null) return Unauthorized();

        await _notificationService.MarkAllReadAsync(userId.Value);
        return NoContent();
    }

    private static IReadOnlyDictionary<string, string>? DeserializeParams(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;

        return JsonSerializer.Deserialize<Dictionary<string, string>>(json);
    }
}

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
