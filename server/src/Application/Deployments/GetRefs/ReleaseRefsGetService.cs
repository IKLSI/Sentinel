using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.Deployments.GetRefs;

public class ReleaseRefsGetService(
    ReleaseRepositoryLoader repositoryLoader,
    IRepositoryHostClient repositoryHostClient,
    ITenantContext tenant) : IService
{
    public async Task<Result<ReleaseRefsDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ReleaseRefsDto>.Unauthorized();

        Result<ReleaseRepository> loaded = await repositoryLoader.LoadAsync(organizationId, projectId,
            cancellationToken);

        if (loaded.Value is not { } repository)
            return loaded.Code == ErrorCodes.ProjectNotFound
                ? Result<ReleaseRefsDto>.From(loaded)
                : new ReleaseRefsDto();

        (string host, string owner, string repo) =
            (repository.Location.Host, repository.Location.Owner, repository.Location.Repository);

        Task<RepositoryBranchListing?> branchesTask = repositoryHostClient.ListBranchesAsync(host, owner, repo,
            repository.Access, cancellationToken);
        Task<List<string>?> tagsTask = repositoryHostClient.ListTagsAsync(host, owner, repo, repository.Access,
            cancellationToken);

        await Task.WhenAll(branchesTask, tagsTask);

        RepositoryBranchListing? branches = await branchesTask;
        if (branches == null) return new ReleaseRefsDto();

        List<string> tags = (await tagsTask ?? [])
            .OrderByDescending(tag => tag.TrimStart('v', 'V'), VersionComparer.Instance)
            .ToList();
        string? head = repository.Project.Branch ?? branches.DefaultBranch;

        return new ReleaseRefsDto
        {
            Available = true,
            Tags = tags,
            Branches = [.. branches.Branches.Order(StringComparer.OrdinalIgnoreCase)],
            SuggestedHead = head,
            SuggestedBase = tags.FirstOrDefault()
        };
    }
}
