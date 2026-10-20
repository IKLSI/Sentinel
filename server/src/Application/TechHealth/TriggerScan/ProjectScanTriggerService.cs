using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.TriggerScan;

public class ProjectScanTriggerService(
    IProjectRepository projectRepository,
    IJobScheduler backgroundJobs,
    ProjectScanGate scanGate,
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

        if (scanGate.TryQueue(projectId))
            backgroundJobs.Enqueue<ProjectScanService>(JobQueues.Scans, service => service.ScanProjectAsync(projectId,
                CancellationToken.None));

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
