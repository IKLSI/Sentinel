using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IAuditLogRepository : ICrudEntityWithIdRepository<AuditLog>
{
    Task<IReadOnlyList<UserExportAuditLogDto>> ListForUserExportAsync(Guid userId,
        CancellationToken cancellationToken);

    Task<int> DetachUserAsync(Guid userId, CancellationToken cancellationToken);
}
