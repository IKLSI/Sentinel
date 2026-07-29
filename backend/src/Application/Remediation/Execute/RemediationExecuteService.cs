using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using RemediationEngine = Sentinel.Application.Remediation.RemediationService;

namespace Sentinel.Application.Remediation.Execute;

public class RemediationExecuteService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    RemediationEngine remediationEngine,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{

    public async Task<Result<RemediationResultDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<RemediationResultDto>.Unauthorized();

        bool belongs = await projectRepository
            .ExistsInOrganizationAsync(projectId, organizationId, cancellationToken);

        if (!belongs)
            return Result<RemediationResultDto>.NotFound(ErrorCodes.ProjectNotFound);

        Result subscriptionResult = await EnsureSubscriptionActiveAsync(organizationId, cancellationToken);

        if (!subscriptionResult.IsSuccess)
            return Result<RemediationResultDto>.From(subscriptionResult);

        RemediationResultDto result = await remediationEngine
            .ExecuteAsync(projectId, organizationId, tenant.UserId);

        await auditLog.LogAsync(
            AuditAction.RemediationRequested,
            entityType: AuditEntityTypes.Remediation,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: result.Id,
            jti: tenant.Jti);

        return result;
    }

    private async Task<Result> EnsureSubscriptionActiveAsync(Guid organizationId,
        CancellationToken cancellationToken)
    {
        SubscriptionStatus status = await organizationRepository.GetOrDefaultAsync(organizationId,
            new SingleProjectionQueryOptions<Organization, SubscriptionStatus>
            {
                AsNoTracking = true,
                Expression = o => o.SubscriptionStatus
            },
            cancellationToken);

        if (status is not (SubscriptionStatus.Active or SubscriptionStatus.Trialing))
            return Result.PaymentRequired(ErrorCodes.QuotaRemediationsExceeded);

        return Result.Success();
    }
}
