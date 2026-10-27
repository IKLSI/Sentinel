using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Scanning;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.PublicScan;

public class PublicScanService(
    RepositoryScannerService scanner,
    VulnerabilityScanService vulnerabilityScan,
    RuntimeEolScanService runtimeEol,
    ExploitSignalEnricher exploitSignalEnricher,
    IMemoryCache cache,
    PublicScanThrottle throttle,
    PublicScanValidator validator) : IService
{
    public async Task<Result<PublicScanResponse>> ExecuteAsync(
        PublicScanRequest request,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<PublicScanResponse>.From(validationResult);

        if (!RepositoryLocation.TryParse(request.RepositoryUrl, out RepositoryLocation location))
            return Result<PublicScanResponse>.Error(ErrorCodes.ScanInvalidRepositoryUrl);

        string latestKey = CacheKeys.PublicScanLatest(location.Host, location.Owner, location.Repository);

        if (TryReadCached(latestKey, out PublicScanResponse? latest))
            return Result<PublicScanResponse>.Success(latest!);

        if (!throttle.TryEnter())
            return Result<PublicScanResponse>.Error(ErrorCodes.PublicScanBusy);

        try
        {
            string? headCommitSha = await scanner.GetHeadCommitAsync(request.RepositoryUrl!, null, null,
                cancellationToken);
            string commitKey = CacheKeys.PublicScan(location.Host, location.Owner, location.Repository,
                headCommitSha);

            if (TryReadCached(commitKey, out PublicScanResponse? cached))
            {
                Store(latestKey, cached!, CacheKeys.PublicScanLatestTtl);
                return Result<PublicScanResponse>.Success(cached!);
            }

            Result<PublicScanResponse> result = await ScanAsync(request.RepositoryUrl!, headCommitSha,
                cancellationToken);

            if (result.IsSuccess && result.Value is { } response)
            {
                Store(commitKey, response,
                    headCommitSha == null ? CacheKeys.PublicScanUnpinnedTtl : CacheKeys.PublicScanTtl);
                Store(latestKey, response, CacheKeys.PublicScanLatestTtl);
            }

            return result;
        }
        finally
        {
            throttle.Exit();
        }
    }

    private bool TryReadCached(string key, out PublicScanResponse? response) =>
        cache.TryGetValue(key, out response) && response != null;

    private void Store(string key, PublicScanResponse response, TimeSpan lifetime) =>
        cache.Set(key, response, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = lifetime,
            Size = 1
        });

    private async Task<Result<PublicScanResponse>> ScanAsync(string repositoryUrl, string? headCommitSha,
        CancellationToken cancellationToken)
    {
        Guid ephemeralId = Guid.NewGuid();

        ScanOutcome outcome = await scanner.ScanRepositoryAsync(ephemeralId, repositoryUrl, null, headCommitSha,
            null, cancellationToken);

        if (outcome.Error != null)
            return Result<PublicScanResponse>.Error(outcome.Error);

        if (outcome.Dependencies.Count == 0 && outcome.Runtimes.Count == 0)
            return Result<PublicScanResponse>.Error(ErrorCodes.ScanNoDependencies);

        VulnerabilityScanOutcome vulnerabilityOutcome = await vulnerabilityScan.ScanAsync(
            outcome.Dependencies, new Dictionary<string, DateTime>(), cancellationToken);

        if (!vulnerabilityOutcome.IsComplete)
            return Result<PublicScanResponse>.Error(ErrorCodes.ScanVulnerabilityDataIncomplete);

        foreach (VulnerabilityScanResult result in vulnerabilityOutcome.Results)
        {
            foreach (Vulnerability vulnerability in result.NewVulnerabilities)
                result.Dependency.Vulnerabilities.Add(vulnerability);
        }

        IReadOnlyList<RuntimeEolResult> eolResults = await runtimeEol.ScanAsync(outcome.Runtimes, cancellationToken);

        ProjectInventoryWriter.StageRuntimeChanges(eolResults);

        await exploitSignalEnricher.EnrichAsync(outcome.Dependencies, cancellationToken);

        Project project = new() { Dependencies = outcome.Dependencies, Runtimes = outcome.Runtimes };

        int score = HealthScoreCalculator.Calculate(project);
        string grade = HealthScoreCalculator.ToGrade(score);

        int vulnerableDependencyCount = outcome.Dependencies.Count(d => d.Vulnerabilities.Count > 0);
        ProjectInventoryCounts counts = ProjectInventoryCounts.Of(outcome.Dependencies);
        int eolRuntimeCount = RuntimeGrouping.ByName(outcome.Runtimes).Count(FindingRules.IsEol);

        return Result<PublicScanResponse>.Success(new PublicScanResponse(
            grade,
            score,
            outcome.Dependencies.Count,
            vulnerableDependencyCount,
            counts.CriticalVulnerabilities,
            counts.HighVulnerabilities,
            eolRuntimeCount));
    }
}
