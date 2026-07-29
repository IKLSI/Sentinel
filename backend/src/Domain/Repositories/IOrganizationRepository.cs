using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IOrganizationRepository : ICrudEntityWithIdRepository<Organization>
{
    Task<bool> ExistsBySlugAsync(string slug, CancellationToken cancellationToken);

    Task<Organization?> GetOrDefaultByStripeReferenceAsync(string subscriptionId, string? customerId,
        CancellationToken cancellationToken);
}
