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

    Task<Project?> GetOrDefaultInOrganizationWithDependenciesAsync(Guid projectId, Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Project>> ListWithHealthDetailsByHealthRankAsync(Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Project>> ListWithHealthDetailsByNameAsync(Guid organizationId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<string?>> ListRepositoryUrlsAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Guid>> ListIdsDueForScanAsync(ScanFrequency frequency, DateTime threshold,
        CancellationToken cancellationToken);

    Task<bool> ExistsInOrganizationAsync(Guid projectId, Guid organizationId, CancellationToken cancellationToken);

    Task<int> CountByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<int> ClampScanFrequencyAsync(Guid organizationId, IReadOnlyCollection<ScanFrequency> tooFrequent,
        ScanFrequency maxFrequency, CancellationToken cancellationToken);
}
