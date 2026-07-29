using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class NotificationRepository : CrudEntityWithIdRepository<Notification>, INotificationRepository
{
    public NotificationRepository(SentinelContext context) : base(context) { }

    public IQueryable<Notification> GetByUser(Guid userId, QueryableQueryOptions options) =>
        GetAll(options).Where(n => n.UserId == userId);

    public Task<Notification?> GetOrDefaultForUserAsync(Guid notificationId, Guid userId,
        SingleEntityQueryOptions<Notification> options, CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

    public Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);

    public Task<int> DeleteByUserAsync(Guid userId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .Where(n => n.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
}
