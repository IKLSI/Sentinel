using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class AuditLogRepository : CrudEntityWithIdRepository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(SentinelContext context) : base(context) { }

    public IQueryable<AuditLog> GetByUser(Guid userId, QueryableQueryOptions options) =>
        GetAll(options).Where(a => a.UserId == userId);

    public Task<int> DetachUserAsync(Guid userId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .Where(a => a.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.UserId, (Guid?)null), cancellationToken);
}

public class RemediationRequestRepository
    : CrudEntityWithIdRepository<RemediationRequest>, IRemediationRequestRepository
{
    public RemediationRequestRepository(SentinelContext context) : base(context) { }

    public IQueryable<RemediationRequest> GetByProject(Guid projectId, QueryableQueryOptions options) =>
        GetAll(options).Where(r => r.ProjectId == projectId);
}
