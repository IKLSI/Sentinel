using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ProjectBadge;

public class ProjectBadgeDisableService(
    IProjectRepository projectRepository,
    ICommitScopeFactory commitScopeFactory,
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

        if (project.BadgeToken != null)
        {
            using ICommitScope commitScope = commitScopeFactory.Begin();
            project.BadgeToken = null;
            await commitScope.CommitAsync(cancellationToken);
        }

        return Result.NoContent();
    }
}
