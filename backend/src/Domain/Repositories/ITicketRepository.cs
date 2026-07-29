using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketRepository : ICrudEntityWithIdRepository<Ticket>
{
    Task<Ticket?> GetOrDefaultWithDetailsAsync(Guid ticketId, CancellationToken cancellationToken);

    Task<Ticket?> GetOrDefaultWithStatusAsync(Guid ticketId, CancellationToken cancellationToken);

    Task<PagedList<Ticket>> SearchAsync(Guid organizationId, TicketFilter filter, int page, int pageSize,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Ticket>> ListForExportAsync(Guid organizationId, TicketFilter filter,
        CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<Guid, int>> CountByProjectsAsync(IReadOnlyCollection<Guid> projectIds,
        CancellationToken cancellationToken);

    Task<bool> ExistsInOrganizationAsync(Guid ticketId, Guid organizationId, CancellationToken cancellationToken);

    Task<int> DeleteInOrganizationAsync(Guid ticketId, Guid organizationId, CancellationToken cancellationToken);
}
