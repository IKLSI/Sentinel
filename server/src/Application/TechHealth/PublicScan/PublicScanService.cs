using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.PublicScan;

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

        string? headCommitSha = await scanner.GetHeadCommitAsync(request.RepositoryUrl!);
        string cacheKey = CacheKeys.PublicScan(location.Host, location.Owner, location.Repository, headCommitSha);

        if (cache.TryGetValue(cacheKey, out PublicScanResponse? cached) && cached != null)
            return Result<PublicScanResponse>.Success(cached);

        if (!throttle.TryEnter())
            return Result<PublicScanResponse>.Error(ErrorCodes.PublicScanBusy);

        Result<PublicScanResponse> result;

        try
        {
            result = await ScanAsync(request.RepositoryUrl!, headCommitSha);
        }
        finally
        {
            throttle.Exit();
        }

        if (result.IsSuccess && result.Value is { } response)
        {
            cache.Set(cacheKey, response, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = headCommitSha == null
                    ? CacheKeys.PublicScanUnpinnedTtl
                    : CacheKeys.PublicScanTtl,
                Size = 1
            });
        }

        return result;
    }

    private async Task<Result<PublicScanResponse>> ScanAsync(string repositoryUrl, string? headCommitSha)
    {
        Guid ephemeralId = Guid.NewGuid();

        ScanOutcome outcome = await scanner.ScanRepositoryAsync(ephemeralId, repositoryUrl, commitSha: headCommitSha);

        if (outcome.Error != null)
            return Result<PublicScanResponse>.Error(outcome.Error);

        if (outcome.Dependencies.Count == 0 && outcome.Runtimes.Count == 0)
            return Result<PublicScanResponse>.Error(ErrorCodes.ScanNoDependencies);

        VulnerabilityScanOutcome vulnerabilityOutcome = await vulnerabilityScan.ScanAsync(
            outcome.Dependencies, new Dictionary<string, DateTime>());

        if (!vulnerabilityOutcome.IsComplete)
            return Result<PublicScanResponse>.Error(ErrorCodes.ScanVulnerabilityDataIncomplete);

        foreach (VulnerabilityScanResult result in vulnerabilityOutcome.Results)
        {
            foreach (Vulnerability vulnerability in result.NewVulnerabilities)
                result.Dependency.Vulnerabilities.Add(vulnerability);
        }

        IReadOnlyList<RuntimeEolResult> eolResults = await runtimeEol.ScanAsync(outcome.Runtimes);

        foreach (RuntimeEolResult result in eolResults)
            result.Runtime.IsEol = result.IsEol;

        await exploitSignalEnricher.EnrichAsync(outcome.Dependencies);

        Project project = new() { Dependencies = outcome.Dependencies, Runtimes = outcome.Runtimes };

        int score = HealthScoreCalculator.Calculate(project);
        string grade = HealthScoreCalculator.ToGrade(score);

        int vulnerableDependencyCount = outcome.Dependencies.Count(d => d.Vulnerabilities.Count > 0);
        int criticalCount = outcome.Dependencies
            .SelectMany(d => d.Vulnerabilities)
            .Count(v => v.Severity == VulnerabilitySeverity.Critical);
        int highCount = outcome.Dependencies
            .SelectMany(d => d.Vulnerabilities)
            .Count(v => v.Severity == VulnerabilitySeverity.High);
        int eolRuntimeCount = RuntimeGrouping.ByName(outcome.Runtimes).Count(FindingRules.IsEol);

        return Result<PublicScanResponse>.Success(new PublicScanResponse(
            grade,
            score,
            outcome.Dependencies.Count,
            vulnerableDependencyCount,
            criticalCount,
            highCount,
            eolRuntimeCount));
    }
}
