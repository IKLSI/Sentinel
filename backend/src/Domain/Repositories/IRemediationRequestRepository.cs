using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IRemediationRequestRepository : ICrudEntityWithIdRepository<RemediationRequest>
{
    IQueryable<RemediationRequest> GetByProject(Guid projectId, QueryableQueryOptions options);
}
