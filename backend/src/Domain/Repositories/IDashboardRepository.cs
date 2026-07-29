using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IDashboardRepository
{
    Task<IReadOnlyDictionary<Guid, int>> GetTicketCountsByStatusAsync(Guid organizationId,
        CancellationToken cancellationToken);

    Task<DashboardCounters?> GetCountersAsync(Guid organizationId, IReadOnlyCollection<Guid> openStatusIds,
        IReadOnlyCollection<Guid> closedStatusIds, DashboardPeriod period, CancellationToken cancellationToken);

    Task<int> CountCriticalVulnerabilitiesAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<TicketPriority, int>> GetOpenTicketCountsByPriorityAsync(Guid organizationId,
        IReadOnlyCollection<Guid> openStatusIds, CancellationToken cancellationToken);

    Task<IReadOnlyList<UrgentTicketRow>> GetUrgentTicketsAsync(Guid organizationId,
        IReadOnlyCollection<Guid> openStatusIds, int take, CancellationToken cancellationToken);

    Task<IReadOnlyList<ClosedTicketActivityRow>> GetClosedTicketActivityAsync(Guid organizationId, DateTime since,
        int take, CancellationToken cancellationToken);

    Task<IReadOnlyList<CreatedTicketActivityRow>> GetCreatedTicketActivityAsync(Guid organizationId, DateTime since,
        int take, CancellationToken cancellationToken);

    Task<IReadOnlyList<VulnerabilityActivityRow>> GetCriticalVulnerabilityActivityAsync(Guid organizationId,
        DateTime since, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<DateTime, int>> GetVulnerabilityDetectionCountsAsync(Guid organizationId,
        DateTime windowStart, CancellationToken cancellationToken);
}
