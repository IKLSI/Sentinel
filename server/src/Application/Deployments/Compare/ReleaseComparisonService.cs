using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Deployments.Compare;

public class ReleaseComparisonService(
    ReleaseRepositoryLoader repositoryLoader,
    IRepositoryHostClient repositoryHostClient,
    ReleaseSnapshotReader snapshotReader,
    ReleaseVulnerabilityAssessor vulnerabilityAssessor,
    IMemoryCache cache,
    ITenantContext tenant,
    ReleaseComparisonValidator validator) : IService
{
    private const string ReferenceParameter = "reference";

    public async Task<Result<ReleaseComparisonDto>> ExecuteAsync(Guid projectId, ReleaseComparisonModel model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ReleaseComparisonDto>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);
        if (!validationResult.IsSuccess)
            return Result<ReleaseComparisonDto>.From(validationResult);

        Result<ReleaseRepository> loaded = await repositoryLoader.LoadAsync(organizationId, projectId,
            cancellationToken);
        if (loaded.Value is not { } repository)
            return Result<ReleaseComparisonDto>.From(loaded);

        string baseReference = model.Base!.Trim();
        string headReference = model.Head!.Trim();

        Task<string?> baseShaTask = ResolveShaAsync(repository, baseReference, cancellationToken);
        Task<string?> headShaTask = ResolveShaAsync(repository, headReference, cancellationToken);
        await Task.WhenAll(baseShaTask, headShaTask);

        if (await baseShaTask is not { } baseSha) return ReferenceNotFound(baseReference);
        if (await headShaTask is not { } headSha) return ReferenceNotFound(headReference);

        string cacheKey = CacheKeys.DeploymentComparison(projectId, $"{baseReference}@{baseSha}",
            $"{headReference}@{headSha}");
        if (cache.TryGetValue(cacheKey, out ReleaseComparisonDto? cached) && cached != null)
            return cached;

        ReleaseComparisonDto? comparison = await CompareAsync(repository, model, baseSha, headSha,
            cancellationToken);

        if (comparison == null)
            return Result<ReleaseComparisonDto>.Error(ErrorCodes.DeploymentComparisonFailed);

        if (!comparison.Summary.InventoryIncomplete && !comparison.Summary.VulnerabilityDataIncomplete)
        {
            cache.Set(cacheKey, comparison, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CacheKeys.DeploymentComparisonTtl,
                Size = 1
            });
        }

        return comparison;
    }

    private async Task<ReleaseComparisonDto?> CompareAsync(ReleaseRepository repository,
        ReleaseComparisonModel model, string baseSha, string headSha, CancellationToken cancellationToken)
    {
        RepositoryComparison? comparison = await repositoryHostClient.CompareAsync(repository.Location.Host,
            repository.Location.Owner, repository.Location.Repository, repository.Access, baseSha, headSha,
            cancellationToken);
        if (comparison == null) return null;

        ReleaseSnapshots? snapshots = await snapshotReader.ReadAsync(repository, baseSha, headSha, comparison,
            cancellationToken);
        if (snapshots == null) return null;

        List<DependencyChange> dependencyChanges = DependencyChanges.Compare(
            snapshots.Base.Inventory.Dependencies, snapshots.Head.Inventory.Dependencies);
        ReleaseVulnerabilityAssessment vulnerabilities =
            await vulnerabilityAssessor.AssessAsync(dependencyChanges, cancellationToken);

        return ReleaseComparisonMapper.ToDto(new ReleaseComparisonParts(model, comparison, snapshots,
            dependencyChanges, vulnerabilities));
    }

    private Task<string?> ResolveShaAsync(ReleaseRepository repository, string reference,
        CancellationToken cancellationToken) =>
        repositoryHostClient.GetHeadCommitAsync(repository.Location.Host, repository.Location.Owner,
            repository.Location.Repository, repository.Access, reference, cancellationToken);

    private static Result<ReleaseComparisonDto> ReferenceNotFound(string reference) =>
        Result<ReleaseComparisonDto>.NotFound(ErrorCodes.DeploymentReferenceNotFound,
            new Dictionary<string, string> { [ReferenceParameter] = reference });
}
