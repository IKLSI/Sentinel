using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IRemediationRequestRepository : ICrudEntityWithIdRepository<RemediationRequest>
{
    Task<IReadOnlyList<RemediationHistoryDto>> ListHistoryByProjectAsync(Guid projectId,
        CancellationToken cancellationToken);

    Task<RemediationRequest?> GetOrDefaultActiveByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}
