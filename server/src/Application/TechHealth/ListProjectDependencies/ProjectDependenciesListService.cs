using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ListProjectDependencies;

public class ProjectDependenciesListService(
    IProjectRepository projectRepository,
    ITicketRepository ticketRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<List<DependencyDto>>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<DependencyDto>>.Unauthorized();

        Project? project = await projectRepository.GetOrDefaultInOrganizationWithDependenciesWithoutVulnerabilitiesAsync(
            projectId, organizationId, cancellationToken);

        if (project == null)
            return Result<List<DependencyDto>>.NotFound(ErrorCodes.ProjectNotFound);

        IReadOnlyList<FindingTicketRow> findingTickets =
            await ticketRepository.ListFindingLinksByProjectAsync(projectId, cancellationToken);

        return ProjectMapper.ToDependencyDtos(project.Dependencies, findingTickets);
    }
}
