using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Audit;

public class AuditLogBatchWriter(IAuditLogRepository repository, ICommitScopeFactory commitScopeFactory)
{
    public async Task WriteAsync(IReadOnlyList<AuditLog> logs, CancellationToken cancellationToken)
    {
        using ICommitScope commitScope = commitScopeFactory.Begin();

        await repository.AddRangeAsync(logs, cancellationToken);
        await commitScope.CommitAsync(cancellationToken);
    }
}
