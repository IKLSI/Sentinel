using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Notifications.MarkAllRead;

public class NotificationMarkAllReadService(INotificationRepository notificationRepository, ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid userId)
            return Result.Unauthorized();

        await notificationRepository.MarkAllReadAsync(userId, cancellationToken);

        return Result.NoContent();
    }
}
