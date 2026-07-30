using Sentinel.Application.Abstractions;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Repositories;
using RemediationEngine = Sentinel.Application.Remediation.RemediationService;

namespace Sentinel.Application.Remediation.Preview;

public class RemediationPreviewService(
    IProjectRepository projectRepository,
    SubscriptionGuard subscriptionGuard,
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

        Result subscriptionResult = await subscriptionGuard
            .EnsureEntitledAsync(organizationId, ErrorCodes.QuotaRemediationsExceeded, cancellationToken);

        if (!subscriptionResult.IsSuccess)
            return Result<RemediationPreviewDto>.From(subscriptionResult);

        return await remediationEngine.PreviewAsync(projectId);
    }
}
