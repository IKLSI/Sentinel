using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Projects.GetById;

public class ProjectGetByIdService(
    IProjectRepository projectRepository,
    ProjectDetailContextLoader detailContextLoader,
    ITenantContext tenant) : IService
{
    public async Task<Result<ProjectDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectDto>.Unauthorized();

        Project? project = await projectRepository
            .GetOrDefaultInOrganizationWithHealthDetailsAsync(projectId, organizationId, cancellationToken);

        if (project == null)
            return Result<ProjectDto>.NotFound(ErrorCodes.ProjectNotFound);

        return ProjectMapper.ToDto(project, await detailContextLoader.LoadAsync(project, cancellationToken));
    }
}
