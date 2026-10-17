using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IOrganizationRepository : ICrudEntityWithIdRepository<Organization>
{
    Task<bool> ExistsBySlugAsync(string slug, CancellationToken cancellationToken);

    Task LockForUpdateAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<int> AllocateTicketNumbersAsync(Guid organizationId, int count, CancellationToken cancellationToken);
}
