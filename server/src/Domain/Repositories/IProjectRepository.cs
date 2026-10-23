using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IProjectRepository : ICrudEntityWithIdRepository<Project>
{
    Task<Project?> GetOrDefaultInOrganizationAsync(Guid projectId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<Project?> GetOrDefaultWithHealthDetailsAsync(Guid projectId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<Project?> GetOrDefaultInOrganizationWithHealthDetailsAsync(Guid projectId, Guid organizationId,
        CancellationToken cancellationToken);

    Task<Project?> GetOrDefaultInOrganizationForFindingAsync(Guid projectId, Guid organizationId, FindingKind kind,
        string findingKey, CancellationToken cancellationToken);

    Task<IReadOnlyList<ProjectSummaryRow>> ListSummariesByHealthRankAsync(Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Project>> ListWithHealthDetailsByNameAsync(Guid organizationId, int take,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Project>> ListScoringGraphsByIdsAsync(Guid organizationId,
        IReadOnlyCollection<Guid> projectIds, CancellationToken cancellationToken);

    Task<IReadOnlyList<string?>> ListRepositoryUrlsAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Guid>> ListIdsByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Guid>> ListIdsDueForScanAsync(ScanFrequency frequency, DateTime threshold,
        CancellationToken cancellationToken);

    Task<bool> ExistsInOrganizationAsync(Guid projectId, Guid organizationId, CancellationToken cancellationToken);

    Task<int> MarkScanFailedAsync(Guid projectId, string errorCode, DateTime scannedAt,
        CancellationToken cancellationToken);

    Task<int> UpdateHealthAsync(Guid projectId, int healthScore, string healthGrade,
        CancellationToken cancellationToken);

    Task<ProjectBadgeRow?> GetOrDefaultBadgeByTokenAcrossTenantsAsync(string badgeToken,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ProjectOptionRow>> ListOptionsByNameAsync(Guid organizationId,
        CancellationToken cancellationToken);
}
