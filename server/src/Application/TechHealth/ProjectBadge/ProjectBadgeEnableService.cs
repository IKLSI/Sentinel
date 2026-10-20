using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ProjectBadge;

public class ProjectBadgeEnableService(
    IProjectRepository projectRepository,
    ICommitScopeFactory commitScopeFactory,
    ITenantContext tenant) : IService
{
    public async Task<Result<ProjectBadgeDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectBadgeDto>.Unauthorized();

        Project? project = await projectRepository.GetOrDefaultInOrganizationAsync(projectId, organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (project == null)
            return Result<ProjectBadgeDto>.NotFound(ErrorCodes.ProjectNotFound);

        if (project.BadgeToken == null)
        {
            using ICommitScope commitScope = commitScopeFactory.Begin();
            project.BadgeToken = ProjectBadgeTokenGenerator.Generate();
            await commitScope.CommitAsync(cancellationToken);
        }

        return Result<ProjectBadgeDto>.Success(new ProjectBadgeDto { Token = project.BadgeToken });
    }
}
