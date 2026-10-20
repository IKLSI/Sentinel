using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.GetProject;

public class ProjectGetByIdService(
    IProjectRepository projectRepository,
    ITicketRepository ticketRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
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

        IReadOnlyList<FindingTicketRow> findingTickets =
            await ticketRepository.ListFindingLinksByProjectAsync(projectId, cancellationToken);

        IReadOnlyList<VulnerabilitySuppression> suppressions =
            await suppressionRepository.ListActiveByProjectAsync(projectId, DateTime.UtcNow, cancellationToken);

        return ProjectMapper.ToDto(project, findingTickets, suppressions);
    }
}
