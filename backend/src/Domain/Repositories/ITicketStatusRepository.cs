using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketStatusRepository : ICrudEntityWithIdRepository<TicketStatus>
{
    Task<IReadOnlyList<TicketStatusDto>> ListForOrganizationAsync(Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TicketStatus>> ListByOrganizationOrderedAsync(Guid organizationId,
        CancellationToken cancellationToken);

    Task<TicketStatus?> GetOrDefaultFirstByOrderAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<bool> ExistsForOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);
}
