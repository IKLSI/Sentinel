using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Settings;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Settings.GetIntegrations;

public class IntegrationSettingsGetService(IOrganizationRepository organizationRepository, ITenantContext tenant) : IService
{
    public async Task<Result<IntegrationSettingsDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<IntegrationSettingsDto>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<IntegrationSettingsDto>.NotFound();

        return new IntegrationSettingsDto
        {
            HasGithubToken = !string.IsNullOrEmpty(organization.GithubToken),
            HasGitlabToken = !string.IsNullOrEmpty(organization.GitlabToken),
        };
    }
}
