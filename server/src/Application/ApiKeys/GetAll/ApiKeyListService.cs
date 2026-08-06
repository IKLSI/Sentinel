using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.GetAll;

public class ApiKeyListService(IApiKeyRepository apiKeyRepository, ITenantContext tenant) : IService
{
    public async Task<Result<List<ApiKeyDto>>> ExecuteAsync(ApiKeySortField sortBy, SortDirection sortDirection,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ApiKeyDto>>.Unauthorized();

        IReadOnlyList<ApiKeyListRow> rows = await apiKeyRepository.ListForOrganizationAsync(organizationId, sortBy,
            sortDirection, cancellationToken);

        return rows.Select(row => new ApiKeyDto
        {
            Id = row.Id,
            Name = row.Name,
            Prefix = row.Prefix,
            ExpiresAt = row.ExpiresAt,
            LastUsedAt = row.LastUsedAt,
            CreatedAt = row.CreatedAt,
            CreatedByName = row.CreatedByName
        }).ToList();
    }
}
