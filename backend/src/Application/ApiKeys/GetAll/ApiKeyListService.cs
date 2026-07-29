using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.ApiKeys;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.GetAll;

public class ApiKeyListService(IApiKeyRepository apiKeyRepository, ITenantContext tenant) : IService
{

    public async Task<Result<List<ApiKeyDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ApiKeyDto>>.Unauthorized();

        return await apiKeyRepository
            .GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly)
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
    }
}
