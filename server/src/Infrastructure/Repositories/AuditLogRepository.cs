using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class AuditLogRepository : CrudEntityWithIdRepository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<UserExportAuditLogRow>> ListForUserExportAsync(Guid userId, int take,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(a => a.UserId == userId)
            .OrderByDescending(al => al.CreatedAt)
            .Take(take)
            .Select(al => new UserExportAuditLogRow(
                al.Id,
                al.Action.ToString(),
                al.EntityType,
                al.EntityId,
                al.CreatedAt))
            .ToListAsync(cancellationToken);

    public Task<int> DetachUserAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(a => a.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.UserId, (Guid?)null), cancellationToken);
}
