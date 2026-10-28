using Sentinel.Application.Common;
using Sentinel.Application.Projects;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Deployments;

public sealed record ReleaseRepository(Project Project, RepositoryLocation Location, RepositoryAccess Access);

public class ReleaseRepositoryLoader(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    TokenProtector tokenProtector)
{
    public async Task<Result<ReleaseRepository>> LoadAsync(Guid organizationId, Guid projectId,
        CancellationToken cancellationToken)
    {
        Project? project = await projectRepository.GetOrDefaultInOrganizationAsync(projectId, organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (project == null)
            return Result<ReleaseRepository>.NotFound(ErrorCodes.ProjectNotFound);

        if (!RepositoryLocation.TryParse(project.RepositoryUrl, out RepositoryLocation location))
            return Result<ReleaseRepository>.NotFound(ErrorCodes.DeploymentRepositoryUnavailable);

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        return new ReleaseRepository(project, location,
            RepositoryAccessFactory.For(project, organization, tokenProtector));
    }
}
