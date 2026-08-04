using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Settings.GetOrganization;

public class OrganizationSettingsGetService(IOrganizationRepository organizationRepository, ITenantContext tenant) : IService
{
    public async Task<Result<OrganizationSettingsDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<OrganizationSettingsDto>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<OrganizationSettingsDto>.NotFound();

        return OrganizationSettingsMapper.ToDto(organization);
    }
}
