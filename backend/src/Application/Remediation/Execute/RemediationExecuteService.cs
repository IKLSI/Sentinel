using Sentinel.Application.Abstractions;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using RemediationEngine = Sentinel.Application.Remediation.RemediationService;

namespace Sentinel.Application.Remediation.Execute;

public class RemediationExecuteService(
    IProjectRepository projectRepository,
    SubscriptionGuard subscriptionGuard,
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

        Result subscriptionResult = await subscriptionGuard
            .EnsureEntitledAsync(organizationId, ErrorCodes.QuotaRemediationsExceeded, cancellationToken);

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
}
