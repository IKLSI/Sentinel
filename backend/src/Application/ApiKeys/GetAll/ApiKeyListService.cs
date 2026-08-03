using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.ApiKeys;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.ApiKeys.GetAll;

public class ApiKeyListService(IApiKeyRepository apiKeyRepository, ITenantContext tenant) : IService
{
    public async Task<Result<List<ApiKeyDto>>> ExecuteAsync(ApiKeySortField sortBy, SortDirection sortDirection,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ApiKeyDto>>.Unauthorized();

        return (await apiKeyRepository.ListForOrganizationAsync(organizationId, sortBy, sortDirection,
            cancellationToken)).ToList();
    }
}
