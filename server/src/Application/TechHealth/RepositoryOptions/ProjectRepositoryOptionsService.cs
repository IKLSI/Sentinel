using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.RepositoryOptions;

public class ProjectRepositoryOptionsService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IRepositoryHostClient repositoryHostClient,
    TokenProtector tokenProtector,
    ITenantContext tenant) : IService
{
    public async Task<Result<ProjectRepositoryOptionsDto>> ExecuteAsync(Guid projectId, string? branch,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectRepositoryOptionsDto>.Unauthorized();

        Project? project = await projectRepository.GetOrDefaultInOrganizationAsync(projectId, organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (project == null)
            return Result<ProjectRepositoryOptionsDto>.NotFound(ErrorCodes.ProjectNotFound);

        if (!RepositoryLocation.TryParse(project.RepositoryUrl, out RepositoryLocation location))
            return new ProjectRepositoryOptionsDto();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);
        RepositoryAccess access = RepositoryAccessFactory.For(project, organization, tokenProtector);

        RepositoryBranchListing? branches = await repositoryHostClient.ListBranchesAsync(location.Host,
            location.Owner, location.Repository, access);

        if (branches == null)
            return new ProjectRepositoryOptionsDto();

        string? selectedBranch = string.IsNullOrWhiteSpace(branch) ? branches.DefaultBranch : branch.Trim();
        string? commitSha = await repositoryHostClient.GetHeadCommitAsync(location.Host, location.Owner,
            location.Repository, access, selectedBranch);

        RepositoryFileListing files = commitSha == null
            ? new RepositoryFileListing([], false)
            : await repositoryHostClient.ListFilesAsync(location.Host, location.Owner, location.Repository, access,
                commitSha);

        return new ProjectRepositoryOptionsDto
        {
            DefaultBranch = branches.DefaultBranch,
            Branches = [.. branches.Branches.Order(StringComparer.OrdinalIgnoreCase)],
            Directories = RepositoryScanPaths.ProjectDirectories(files.Files
                .Where(file => ManifestParserService.IsManifest(file.Name))
                .Select(file => file.Path)),
            Available = true,
            Truncated = branches.Truncated || files.Truncated
        };
    }
}
