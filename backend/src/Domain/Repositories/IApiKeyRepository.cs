using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IApiKeyRepository : ICrudEntityWithIdRepository<ApiKey>
{
    IQueryable<ApiKey> GetByOrganization(Guid organizationId, QueryableQueryOptions options);

    IQueryable<ApiKey> GetActiveByPrefix(string prefix, QueryableQueryOptions options);

    Task<ApiKey?> GetOrDefaultInOrganizationAsync(Guid apiKeyId, Guid organizationId,
        SingleEntityQueryOptions<ApiKey> options, CancellationToken cancellationToken);

    Task<ApiKey?> GetOrDefaultActiveByHashAcrossTenantsAsync(string keyHash, CancellationToken cancellationToken);

    Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken);
}
