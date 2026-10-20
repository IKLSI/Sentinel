using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.Suppressions.RemoveSuppression;

public class RemoveSuppressionService(
    IProjectRepository projectRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    ICommitScopeFactory commitScopeFactory,
    ProjectHealthRecalculator healthRecalculator,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(Guid projectId, Guid suppressionId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result.Unauthorized();

        bool projectExists = await projectRepository.ExistsInOrganizationAsync(projectId, organizationId,
            cancellationToken);

        if (!projectExists)
            return Result.NotFound(ErrorCodes.ProjectNotFound);

        VulnerabilitySuppression? suppression = await suppressionRepository.GetOrDefaultInProjectAsync(
            suppressionId, projectId, QueryTracking.Tracked, cancellationToken);

        if (suppression == null)
            return Result.NotFound(ErrorCodes.SuppressionNotFound);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            suppressionRepository.Remove(suppression);
            await commitScope.CommitAsync(cancellationToken);
        }

        await healthRecalculator.RecalculateAsync(projectId, cancellationToken);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Project, projectId));

        await auditLog.LogAsync(
            AuditAction.VulnerabilitySuppressionRemoved,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: projectId,
            jti: tenant.Jti);

        return Result.NoContent();
    }
}
