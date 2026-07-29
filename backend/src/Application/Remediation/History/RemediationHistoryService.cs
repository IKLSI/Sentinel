using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Remediation.History;

public class RemediationHistoryService(
    IProjectRepository projectRepository,
    IRemediationRequestRepository remediationRequestRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<List<RemediationHistoryDto>>> ExecuteAsync(Guid projectId,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<RemediationHistoryDto>>.Unauthorized();

        bool belongs = await projectRepository
            .ExistsInOrganizationAsync(projectId, organizationId, cancellationToken);

        if (!belongs)
            return Result<List<RemediationHistoryDto>>.NotFound(ErrorCodes.ProjectNotFound);

        return (await remediationRequestRepository.ListHistoryByProjectAsync(projectId, cancellationToken)).ToList();
    }
}
