using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Common.Contracts;
using Sentinel.Application.Scanning;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Jobs.TriggerTechHealthScan;

public class TechHealthScanTriggerService(
    DueProjectScanService dueProjectScanService,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{
    public async Task<Result<ApiMessageResponse>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ApiMessageResponse>.Unauthorized();

        await dueProjectScanService.ScheduleAllForOrganizationAsync(organizationId, cancellationToken);

        await auditLog.LogAsync(
            AuditAction.ScanTriggered,
            entityType: AuditEntityTypes.Organization,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: organizationId,
            jti: tenant.Jti);

        return ApiMessageResponse.Create(SuccessCodes.JobTriggered);
    }
}
