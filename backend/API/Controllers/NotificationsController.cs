using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notificationService;

    public NotificationsController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        List<Notification> notifications = await _notificationService.GetUserNotificationsAsync(userId.Value, unreadOnly);

        var items = notifications.Select(n => new
        {
            n.Id,
            n.Type,
            n.Title,
            n.Message,
            n.IsRead,
            n.CreatedAt,
            n.RelatedEntityType,
            n.RelatedEntityId
        });

        return Ok(new { items, total = notifications.Count });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        await _notificationService.MarkAsReadAsync(id, userId.Value);
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(userId.Value);
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        string? claim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }
}
