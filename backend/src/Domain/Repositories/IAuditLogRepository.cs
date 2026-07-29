using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IAuditLogRepository : ICrudEntityWithIdRepository<AuditLog>
{
    IQueryable<AuditLog> GetByUser(Guid userId, QueryableQueryOptions options);

    Task<int> DetachUserAsync(Guid userId, CancellationToken cancellationToken);
}
