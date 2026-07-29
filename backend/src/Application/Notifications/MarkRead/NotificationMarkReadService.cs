using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Notifications.MarkRead;

public class NotificationMarkReadService(
    INotificationRepository notificationRepository,
    ICommitScopeFactory commitScopeFactory,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid userId)
            return Result.Unauthorized();

        Notification? notification = await notificationRepository.GetOrDefaultForUserAsync(notificationId, userId,
            QueryTracking.Tracked, cancellationToken);

        if (notification == null)
            return Result.NoContent();

        using ICommitScope commitScope = commitScopeFactory.Begin();

        notification.IsRead = true;

        await commitScope.CommitAsync(cancellationToken);

        return Result.NoContent();
    }
}
