using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface INotificationRepository : ICrudEntityWithIdRepository<Notification>
{
    IQueryable<Notification> GetByUser(Guid userId, QueryableQueryOptions options);

    Task<Notification?> GetOrDefaultForUserAsync(Guid notificationId, Guid userId,
        SingleEntityQueryOptions<Notification> options, CancellationToken cancellationToken);

    Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken);

    Task<int> DeleteByUserAsync(Guid userId, CancellationToken cancellationToken);
}
