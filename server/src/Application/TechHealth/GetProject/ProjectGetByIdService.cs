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
    IVulnerabilitySuppressionRepository suppressionRepository,
    IVulnerabilityRemediationRepository remediationRepository,
    IOrganizationRepository organizationRepository,
    IRemediationRunner remediationRunner,
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

        IReadOnlyList<VulnerabilityRemediation> remediations =
            await remediationRepository.ListByProjectAsync(projectId, cancellationToken);

        return ProjectMapper.ToDto(project, findingTickets, suppressions, remediations,
            await IsRemediationAvailableAsync(project, organizationId, cancellationToken));
    }

    private async Task<bool> IsRemediationAvailableAsync(Project project, Guid organizationId,
        CancellationToken cancellationToken)
    {
        if (!remediationRunner.IsConfigured) return false;

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        return !string.IsNullOrEmpty(organization?.ProtectedTokenFor(project.RepositoryType));
    }
}
