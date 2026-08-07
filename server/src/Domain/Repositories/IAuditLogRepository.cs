using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IAuditLogRepository : ICrudEntityWithIdRepository<AuditLog>
{
    Task<IReadOnlyList<UserExportAuditLogRow>> ListForUserExportAsync(Guid userId, int take,
        CancellationToken cancellationToken);

    Task<int> DetachUserAsync(Guid userId, CancellationToken cancellationToken);
}
