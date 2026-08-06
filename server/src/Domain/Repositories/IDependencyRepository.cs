using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IDependencyRepository : ICrudEntityWithIdRepository<Dependency>
{
    Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken);
}
