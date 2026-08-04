using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class ApiKeyRepository : CrudEntityWithIdRepository<ApiKey>, IApiKeyRepository
{
    public ApiKeyRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<ApiKeyListRow>> ListForOrganizationAsync(Guid organizationId,
        ApiKeySortField sortBy, SortDirection sortDirection, CancellationToken cancellationToken)
    {
        IQueryable<ApiKey> query = Query(QueryTracking.NoTracking)
            .Where(k => k.OrganizationId == organizationId)
            .Where(k => !k.IsRevoked);

        return await ApplySort(query, sortBy, sortDirection)
            .Select(k => new ApiKeyListRow(
                k.Id,
                k.Name,
                k.Prefix,
                k.ExpiresAt,
                k.LastUsedAt,
                k.CreatedAt,
                k.CreatedBy.FullName))
            .ToListAsync(cancellationToken);
    }

    internal static IOrderedQueryable<ApiKey> ApplySort(IQueryable<ApiKey> query, ApiKeySortField sortBy,
        SortDirection sortDirection)
    {
        bool descending = sortDirection == SortDirection.Desc;

        return sortBy switch
        {
            ApiKeySortField.Name => descending
                ? query.OrderByDescending(k => k.Name)
                : query.OrderBy(k => k.Name),
            ApiKeySortField.Prefix => descending
                ? query.OrderByDescending(k => k.Prefix)
                : query.OrderBy(k => k.Prefix),
            ApiKeySortField.CreatedBy => descending
                ? query.OrderByDescending(k => k.CreatedBy.FullName)
                : query.OrderBy(k => k.CreatedBy.FullName),
            ApiKeySortField.Expires => descending
                ? query.OrderBy(k => k.ExpiresAt == null).ThenByDescending(k => k.ExpiresAt)
                : query.OrderBy(k => k.ExpiresAt == null).ThenBy(k => k.ExpiresAt),
            ApiKeySortField.LastUsed => descending
                ? query.OrderByDescending(k => k.LastUsedAt)
                : query.OrderBy(k => k.LastUsedAt),
            _ => descending
                ? query.OrderByDescending(k => k.CreatedAt)
                : query.OrderBy(k => k.CreatedAt)
        };
    }

    public Task<ApiKey?> GetOrDefaultActiveInOrganizationAsync(Guid apiKeyId, Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(k => k.OrganizationId == organizationId)
            .FirstOrDefaultAsync(k => k.Id == apiKeyId && !k.IsRevoked, cancellationToken);

    public Task<ApiKey?> GetOrDefaultInOrganizationAsync(Guid apiKeyId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking)
            .FirstOrDefaultAsync(k => k.Id == apiKeyId && k.OrganizationId == organizationId, cancellationToken);

    public Task<ApiKey?> GetOrDefaultActiveByHashAcrossTenantsAsync(string keyHash,
        CancellationToken cancellationToken) =>
        Context.ApiKeys
            .IgnoreQueryFilters()
            .Include(k => k.CreatedBy)
            .FirstOrDefaultAsync(k => k.KeyHash == keyHash && !k.IsRevoked, cancellationToken);

    public Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(k => k.CreatedById == userId && !k.IsRevoked)
            .ExecuteUpdateAsync(s => s.SetProperty(k => k.IsRevoked, true), cancellationToken);
}
