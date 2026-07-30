using Hangfire;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.TriggerScan;

public class ProjectScanTriggerService(
    IProjectRepository projectRepository,
    IBackgroundJobClient backgroundJobs,
    QuotaGuard quotaGuard,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result.Unauthorized();

        bool belongs = await projectRepository
            .ExistsInOrganizationAsync(projectId, organizationId, cancellationToken);

        if (!belongs)
            return Result.NotFound(ErrorCodes.ProjectNotFound);

        Result quotaResult = await quotaGuard.TryConsumeScanAsync(organizationId, cancellationToken);

        if (!quotaResult.IsSuccess)
            return quotaResult;

        backgroundJobs.Enqueue<TechHealthService>(s =>
            s.ScanProjectWithReservedQuotaAsync(projectId, organizationId));

        await auditLog.LogAsync(
            AuditAction.ScanTriggered,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: projectId,
            jti: tenant.Jti);

        return Result.Accepted();
    }
}
