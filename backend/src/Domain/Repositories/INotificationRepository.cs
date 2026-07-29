using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface INotificationRepository : ICrudEntityWithIdRepository<Notification>
{
    Task<IReadOnlyList<Notification>> ListRecentForUserAsync(Guid userId, int maxItems,
        CancellationToken cancellationToken);

    Task<Notification?> GetOrDefaultForUserAsync(Guid notificationId, Guid userId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken);

    Task<int> DeleteByUserAsync(Guid userId, CancellationToken cancellationToken);
}
