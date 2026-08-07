using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface ITicketRepository : ICrudEntityWithIdRepository<Ticket>
{
    Task<Ticket?> GetOrDefaultWithDetailsAsync(Guid ticketId, CancellationToken cancellationToken);

    Task<PagedList<TicketGridRow>> SearchAsync(Guid organizationId, TicketFilter filter, TicketSortField sortBy,
        SortDirection sortDirection, int page, int pageSize, CancellationToken cancellationToken);

    Task<IReadOnlyList<TicketGridRow>> ListForExportAsync(Guid organizationId, TicketFilter filter, int maxRows,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<UserExportTicketRow>> ListForUserDataExportAsync(Guid userId, int take,
        CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<Guid, int>> CountByProjectsAsync(IReadOnlyCollection<Guid> projectIds,
        CancellationToken cancellationToken);

    Task<bool> ExistsInOrganizationAsync(Guid ticketId, Guid organizationId, CancellationToken cancellationToken);

    Task<int> DeleteInOrganizationAsync(Guid ticketId, Guid organizationId, CancellationToken cancellationToken);
}
