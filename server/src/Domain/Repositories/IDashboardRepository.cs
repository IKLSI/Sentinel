namespace Sentinel.Domain.Repositories;

public interface IDashboardRepository
{
    Task<IReadOnlyList<UrgentTicketRow>> GetUrgentTicketsAsync(Guid organizationId, int take,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ClosedTicketActivityRow>> GetClosedTicketActivityAsync(Guid organizationId, DateTime since,
        int take, CancellationToken cancellationToken);

    Task<IReadOnlyList<CreatedTicketActivityRow>> GetCreatedTicketActivityAsync(Guid organizationId, DateTime since,
        int take, CancellationToken cancellationToken);

    Task<IReadOnlyList<VulnerabilityActivityRow>> GetCriticalVulnerabilityActivityAsync(Guid organizationId,
        DateTime since, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<DateTime, int>> GetVulnerabilityDetectionCountsAsync(Guid organizationId,
        DateTime windowStart, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<DateTime, int>> GetResolvedVulnerabilityDetectionCountsAsync(Guid organizationId,
        DateTime windowStart, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<DateTime, int>> GetVulnerabilityResolutionCountsAsync(Guid organizationId,
        DateTime windowStart, CancellationToken cancellationToken);

    Task<IReadOnlyList<ScoreSnapshotRow>> GetScoreSnapshotsAsync(Guid organizationId, DateOnly windowStart,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<OpenTicketRow>> GetOpenTicketsAsync(Guid organizationId, CancellationToken cancellationToken);
}
