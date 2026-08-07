using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
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

    public async Task<IReadOnlyList<ComplianceAuditLogRow>> ListForProjectAsync(Guid projectId, Guid organizationId,
        int take, CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(a => a.EntityType == AuditEntityTypes.Project && a.EntityId == projectId
                && a.OrganizationId == organizationId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(take)
            .GroupJoin(Context.Set<User>(), a => a.UserId, u => (Guid?)u.Id, (a, users) => new { a, users })
            .SelectMany(x => x.users.DefaultIfEmpty(), (x, u) => new ComplianceAuditLogRow(
                x.a.Action.ToString(),
                x.a.CreatedAt,
                u == null ? null : u.FirstName,
                u == null ? null : u.LastName,
                u == null ? null : u.Email))
            .ToListAsync(cancellationToken);

    public Task<int> DetachUserAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(a => a.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.UserId, (Guid?)null), cancellationToken);
}
