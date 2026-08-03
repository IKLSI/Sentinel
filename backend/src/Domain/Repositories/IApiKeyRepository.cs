using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.ApiKeys;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IApiKeyRepository : ICrudEntityWithIdRepository<ApiKey>
{
    Task<IReadOnlyList<ApiKeyDto>> ListForOrganizationAsync(Guid organizationId, ApiKeySortField sortBy,
        SortDirection sortDirection, CancellationToken cancellationToken);

    Task<ApiKey?> GetOrDefaultActiveInOrganizationAsync(Guid apiKeyId, Guid organizationId,
        CancellationToken cancellationToken);

    Task<ApiKey?> GetOrDefaultInOrganizationAsync(Guid apiKeyId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<ApiKey?> GetOrDefaultActiveByHashAcrossTenantsAsync(string keyHash, CancellationToken cancellationToken);

    Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken);
}
