using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Projects;

public class ProjectDetailContextLoader(
    ITicketRepository ticketRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    IVulnerabilityRemediationRepository remediationRepository,
    IOrganizationRepository organizationRepository,
    IRemediationRunner remediationRunner)
{
    public async Task<ProjectDetailContext> LoadAsync(Project project, CancellationToken cancellationToken)
    {
        IReadOnlyList<FindingTicketRow> findingTickets =
            await ticketRepository.ListFindingLinksByProjectAsync(project.Id, cancellationToken);

        IReadOnlyList<VulnerabilitySuppression> suppressions =
            await suppressionRepository.ListActiveByProjectAsync(project.Id, DateTime.UtcNow, cancellationToken);

        VulnerabilityRemediation? remediation = await remediationRepository.GetOrDefaultByProjectAsync(project.Id,
            QueryTracking.NoTracking, cancellationToken);

        return new ProjectDetailContext(findingTickets, suppressions, remediation,
            await IsRemediationAvailableAsync(project, cancellationToken));
    }

    private async Task<bool> IsRemediationAvailableAsync(Project project, CancellationToken cancellationToken)
    {
        if (!remediationRunner.IsConfigured) return false;

        Organization? organization = await organizationRepository.GetOrDefaultAsync(project.OrganizationId,
            QueryTracking.NoTracking, cancellationToken);

        return !string.IsNullOrEmpty(organization?.ProtectedTokenFor(project.RepositoryType));
    }
}
