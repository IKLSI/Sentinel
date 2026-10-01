using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.GetProject;

public class ProjectGetByIdService(
    IProjectRepository projectRepository,
    ITicketRepository ticketRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<ProjectDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectDto>.Unauthorized();

        Project? project = await projectRepository
            .GetOrDefaultWithHealthDetailsAsync(projectId, QueryTracking.NoTracking, cancellationToken);

        if (project == null)
            return Result<ProjectDto>.NotFound(ErrorCodes.ProjectNotFound);

        bool belongs = await projectRepository
            .ExistsInOrganizationAsync(projectId, organizationId, cancellationToken);

        if (!belongs)
            return Result<ProjectDto>.Forbidden();

        IReadOnlyList<FindingTicketRow> findingTickets =
            await ticketRepository.ListFindingLinksByProjectAsync(projectId, cancellationToken);

        return ProjectMapper.ToDto(project, findingTickets);
    }
}
