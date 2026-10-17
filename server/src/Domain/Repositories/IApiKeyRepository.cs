using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IApiKeyRepository : ICrudEntityWithIdRepository<ApiKey>
{
    Task<IReadOnlyList<ApiKeyListRow>> ListForOrganizationAsync(Guid organizationId, ApiKeySortField sortBy,
        SortDirection sortDirection, CancellationToken cancellationToken);

    Task<ApiKey?> GetOrDefaultActiveInOrganizationAsync(Guid apiKeyId, Guid organizationId,
        CancellationToken cancellationToken);

    Task<ApiKey?> GetOrDefaultInOrganizationAsync(Guid apiKeyId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<ApiKeyAuthenticationRow?> GetOrDefaultActiveAuthenticationByHashAcrossTenantsAsync(string keyHash,
        CancellationToken cancellationToken);

    Task<int> UpdateLastUsedAtAcrossTenantsAsync(Guid apiKeyId, DateTime usedAt, DateTime staleBefore,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListKeyHashesForUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken);
}
