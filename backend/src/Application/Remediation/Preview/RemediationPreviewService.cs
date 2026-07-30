using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using RemediationEngine = Sentinel.Application.Remediation.RemediationService;

namespace Sentinel.Application.Remediation.Preview;

public class RemediationPreviewService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    RemediationEngine remediationEngine,
    ITenantContext tenant) : IService
{
    public async Task<Result<RemediationPreviewDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<RemediationPreviewDto>.Unauthorized();

        bool belongs = await projectRepository
            .ExistsInOrganizationAsync(projectId, organizationId, cancellationToken);

        if (!belongs)
            return Result<RemediationPreviewDto>.NotFound(ErrorCodes.ProjectNotFound);

        SubscriptionStatus status = await organizationRepository
            .GetSubscriptionStatusOrDefaultAsync(organizationId, cancellationToken);

        if (status is not (SubscriptionStatus.Active or SubscriptionStatus.Trialing))
            return Result<RemediationPreviewDto>.PaymentRequired(ErrorCodes.QuotaRemediationsExceeded);

        return await remediationEngine.PreviewAsync(projectId);
    }
}
