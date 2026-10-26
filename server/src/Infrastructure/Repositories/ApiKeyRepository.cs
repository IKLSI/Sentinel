using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
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
            ApiKeySortField.Name => query.OrderBy(k => k.Name, descending),
            ApiKeySortField.Prefix => query.OrderBy(k => k.Prefix, descending),
            ApiKeySortField.CreatedBy => query.OrderBy(k => k.CreatedBy.FullName, descending),
            ApiKeySortField.Expires => query.OrderBy(k => k.ExpiresAt == null)
                .ThenBy(k => k.ExpiresAt, descending),
            ApiKeySortField.LastUsed => query.OrderBy(k => k.LastUsedAt, descending),
            _ => query.OrderBy(k => k.CreatedAt, descending)
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

    public Task<ApiKeyAuthenticationRow?> GetOrDefaultActiveAuthenticationByHashAcrossTenantsAsync(string keyHash,
        CancellationToken cancellationToken) =>
        Context.ApiKeys
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(k => k.KeyHash == keyHash && !k.IsRevoked)
            .Select(k => new ApiKeyAuthenticationRow(
                k.Id,
                k.ExpiresAt,
                k.LastUsedAt,
                k.CreatedBy.Id,
                k.CreatedBy.Email,
                k.CreatedBy.Role,
                k.CreatedBy.AccessStatus,
                k.CreatedBy.OrganizationId))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<int> UpdateLastUsedAtAcrossTenantsAsync(Guid apiKeyId, DateTime usedAt, DateTime staleBefore,
        CancellationToken cancellationToken) =>
        Context.ApiKeys
            .IgnoreQueryFilters()
            .Where(k => k.Id == apiKeyId && (k.LastUsedAt == null || k.LastUsedAt < staleBefore))
            .ExecuteUpdateAsync(s => s.SetProperty(k => k.LastUsedAt, usedAt), cancellationToken);

    public async Task<IReadOnlyList<string>> ListKeyHashesForUserAsync(Guid userId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(k => k.CreatedById == userId)
            .Select(k => k.KeyHash)
            .ToListAsync(cancellationToken);

    public Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(k => k.CreatedById == userId && !k.IsRevoked)
            .ExecuteUpdateAsync(s => s.SetProperty(k => k.IsRevoked, true), cancellationToken);
}
