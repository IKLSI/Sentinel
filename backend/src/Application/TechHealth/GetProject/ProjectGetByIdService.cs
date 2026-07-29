using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.GetProject;

public class ProjectGetByIdService(
    IProjectRepository projectRepository,
    TechHealthService techHealthService,
    ITenantContext tenant) : IService
{

    public async Task<Result<ProjectDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectDto>.Unauthorized();

        ProjectDto? project = await techHealthService.GetProjectWithDetailsAsync(projectId);

        if (project == null)
            return Result<ProjectDto>.NotFound(ErrorCodes.ProjectNotFound);

        bool belongs = await projectRepository
            .ExistsInOrganizationAsync(projectId, organizationId, cancellationToken);

        if (!belongs)
            return Result<ProjectDto>.Forbidden();

        return project;
    }
}
