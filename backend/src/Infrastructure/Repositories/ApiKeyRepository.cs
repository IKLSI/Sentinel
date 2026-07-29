using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class ApiKeyRepository : CrudEntityWithIdRepository<ApiKey>, IApiKeyRepository
{
    public ApiKeyRepository(SentinelContext context) : base(context) { }

    public IQueryable<ApiKey> GetByOrganization(Guid organizationId, QueryableQueryOptions options) =>
        GetAll(options).Where(k => k.OrganizationId == organizationId);

    public IQueryable<ApiKey> GetActiveByPrefix(string prefix, QueryableQueryOptions options) =>
        GetAll(options).Where(k => k.Prefix == prefix && !k.IsRevoked);

    public Task<ApiKey?> GetOrDefaultInOrganizationAsync(Guid apiKeyId, Guid organizationId,
        SingleEntityQueryOptions<ApiKey> options, CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(k => k.Id == apiKeyId && k.OrganizationId == organizationId, cancellationToken);

    public Task<ApiKey?> GetOrDefaultActiveByHashAcrossTenantsAsync(string keyHash,
        CancellationToken cancellationToken) =>
        Context.ApiKeys
            .IgnoreQueryFilters()
            .Include(k => k.CreatedBy)
            .FirstOrDefaultAsync(k => k.KeyHash == keyHash && !k.IsRevoked, cancellationToken);

    public Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .Where(k => k.CreatedById == userId && !k.IsRevoked)
            .ExecuteUpdateAsync(s => s.SetProperty(k => k.IsRevoked, true), cancellationToken);
}
