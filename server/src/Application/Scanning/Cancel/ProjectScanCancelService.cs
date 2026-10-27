using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Scanning.Cancel;

public class ProjectScanCancelService(
    IProjectRepository projectRepository,
    ProjectScanGate scanGate,
    ScanProgressTracker scanProgress,
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

        ScanCancellation cancellation = scanGate.TryCancel(projectId);

        if (cancellation == ScanCancellation.NotCancellable)
            return Result.Conflict(ErrorCodes.ScanNotCancellable);

        if (cancellation == ScanCancellation.Withdrawn)
            scanProgress.Complete(projectId);

        await auditLog.LogAsync(
            AuditAction.ScanCancelled,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: projectId,
            jti: tenant.Jti);

        return Result.NoContent();
    }
}
