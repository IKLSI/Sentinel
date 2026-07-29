using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class NotificationRepository : CrudEntityWithIdRepository<Notification>, INotificationRepository
{
    public NotificationRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<Notification>> ListRecentForUserAsync(Guid userId, int maxItems,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(maxItems)
            .ToListAsync(cancellationToken);

    public Task<Notification?> GetOrDefaultForUserAsync(Guid notificationId, Guid userId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking)
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

    public Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);

    public Task<int> DeleteByUserAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(n => n.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
}
