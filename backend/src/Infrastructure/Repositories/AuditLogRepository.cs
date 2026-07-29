using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class AuditLogRepository : CrudEntityWithIdRepository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<UserExportAuditLogDto>> ListForUserExportAsync(Guid userId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(a => a.UserId == userId)
            .OrderByDescending(al => al.CreatedAt)
            .Select(al => new UserExportAuditLogDto
            {
                Id = al.Id,
                Action = al.Action.ToString(),
                EntityType = al.EntityType,
                EntityId = al.EntityId,
                CreatedAt = al.CreatedAt
            })
            .ToListAsync(cancellationToken);

    public Task<int> DetachUserAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(a => a.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.UserId, (Guid?)null), cancellationToken);
}

public class RemediationRequestRepository
    : CrudEntityWithIdRepository<RemediationRequest>, IRemediationRequestRepository
{
    public RemediationRequestRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<RemediationHistoryDto>> ListHistoryByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RemediationHistoryDto
            {
                Id = r.Id,
                Status = r.Status.ToString(),
                PullRequestUrl = r.PullRequestUrl,
                DependenciesPatched = r.DependenciesPatched,
                HasBreakingChanges = r.HasBreakingChanges,
                Error = r.Error,
                CreatedAt = r.CreatedAt,
                CompletedAt = r.CompletedAt
            })
            .ToListAsync(cancellationToken);

    public Task<RemediationRequest?> GetOrDefaultActiveByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(r => r.ProjectId == projectId)
            .Where(r => r.Status == RemediationStatus.PullRequestOpen || r.Status == RemediationStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
}
