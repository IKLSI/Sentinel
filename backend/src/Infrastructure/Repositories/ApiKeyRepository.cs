using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.ApiKeys;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class ApiKeyRepository : CrudEntityWithIdRepository<ApiKey>, IApiKeyRepository
{
    public ApiKeyRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<ApiKeyDto>> ListForOrganizationAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(k => k.OrganizationId == organizationId)
            .Where(k => !k.IsRevoked)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyDto
            {
                Id = k.Id,
                Name = k.Name,
                Prefix = k.Prefix,
                ExpiresAt = k.ExpiresAt,
                LastUsedAt = k.LastUsedAt,
                CreatedAt = k.CreatedAt,
                CreatedByName = k.CreatedBy.FullName,
            })
            .ToListAsync(cancellationToken);

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
