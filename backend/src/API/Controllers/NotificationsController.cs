using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.Notifications.GetAll;
using Sentinel.Application.Notifications.MarkAllRead;
using Sentinel.Application.Notifications.MarkRead;
using Sentinel.Domain.DTOs.Notifications;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/notifications")]
[Route("api/v{version:apiVersion}/notifications")]
[Authorize]
public class NotificationsController : BaseController
{
    [HttpGet]
    public async Task<ActionResult<NotificationsResponse>> GetNotifications(
        [FromServices] NotificationListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(
        Guid id,
        [FromServices] NotificationMarkReadService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(
        [FromServices] NotificationMarkAllReadService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));
}
