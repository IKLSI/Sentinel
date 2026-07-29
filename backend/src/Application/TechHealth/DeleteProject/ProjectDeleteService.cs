using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.DeleteProject;

public class ProjectDeleteService(
    IProjectRepository projectRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result.Unauthorized();

        Project? project = await projectRepository.GetOrDefaultInOrganizationAsync(projectId, organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (project == null)
            return Result.NotFound(ErrorCodes.ProjectNotFound);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            projectRepository.Remove(project);
            await commitScope.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.ProjectDeleted,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: projectId,
            jti: tenant.Jti);

        return Result.NoContent();
    }
}
