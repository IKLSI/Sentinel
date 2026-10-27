using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Projects.GetOverview;

public class ProjectOverviewGetService(
    IProjectRepository projectRepository,
    ProjectDetailContextLoader detailContextLoader,
    ITenantContext tenant) : IService
{
    public async Task<Result<ProjectOverviewDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectOverviewDto>.Unauthorized();

        Project? project = await projectRepository
            .GetOrDefaultInOrganizationWithVulnerableDependenciesAsync(projectId, organizationId, cancellationToken);

        if (project == null)
            return Result<ProjectOverviewDto>.NotFound(ErrorCodes.ProjectNotFound);

        return ProjectMapper.ToOverviewDto(project, await detailContextLoader.LoadAsync(project, cancellationToken));
    }
}
