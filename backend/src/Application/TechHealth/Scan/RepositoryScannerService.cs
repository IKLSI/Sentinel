using Microsoft.Extensions.Logging;
using Sentinel.Domain.Versioning;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Git;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Scan;

public record ScanOutcome(List<Dependency> Dependencies, List<Runtime> Runtimes, string? Error, int ManifestsRead = 0);

internal record ParsedManifest(bool IsLockFile, List<Dependency> Dependencies, List<Runtime> Runtimes);

public class RepositoryScannerService(
    IRepositoryHostClient hostClient,
    ManifestParserService parser,
    IDependencyRegistryClient registry,
    ILogger<RepositoryScannerService> logger)
{
    private const int MaxConcurrentDownloads = 10;
    private const int MaxManifestFiles = 200;

    public async Task<ScanOutcome> ScanRepositoryAsync(Guid projectId, string repoUrl, string? tokenOverride = null)
    {
        try
        {
            if (!RepositoryLocation.TryParse(repoUrl, out RepositoryLocation location))
            {
                return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                    ErrorCodes.ScanInvalidRepositoryUrl);
            }

            (string host, string owner, string repo) = (location.Host, location.Owner, location.Repository);
            List<(string Name, string Url)> files = await hostClient.ListFilesAsync(host, owner, repo, tokenOverride);

            if (files.Count == 0)
            {
                return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                    ErrorCodes.ScanNoAccessibleFiles);
            }

            List<(string Name, string Url)> discoveredManifests = files
                .Where(f => ManifestParserService.IsManifest(f.Name))
                .ToList();

            List<(string Name, string Url)> manifestFiles = discoveredManifests
                .Take(MaxManifestFiles)
                .ToList();

            if (discoveredManifests.Count > MaxManifestFiles)
            {
                logger.LogWarning(
                    "Repository {RepoUrl}: {Total} manifests detected, only the first {Max} are analyzed",
                    repoUrl, discoveredManifests.Count, MaxManifestFiles);
            }

            using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentDownloads);

            ParsedManifest?[] parsedManifests = await Task.WhenAll(manifestFiles.Select(async file =>
            {
                string? content;

                await throttle.WaitAsync();
                try { content = await hostClient.FetchTextAsync(host, file.Url, tokenOverride); }
                finally { throttle.Release(); }

                if (content == null) return null;

                try
                {
                    (List<Dependency> deps, List<Runtime> rts) = parser.Parse(projectId, file.Name, content);

                    return new ParsedManifest(ManifestParserService.IsLockFile(file.Name), deps, rts);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Manifest {File} could not be parsed and is ignored", file.Name);
                    return null;
                }
            }));

            List<Dependency> manifestDeps = new();
            List<Dependency> lockDeps = new();
            List<Runtime> allRuntimes = new();
            int manifestsRead = 0;

            foreach (ParsedManifest parsed in parsedManifests.OfType<ParsedManifest>())
            {
                manifestsRead++;

                if (parsed.IsLockFile)
                {
                    lockDeps.AddRange(parsed.Dependencies);
                }
                else
                {
                    manifestDeps.AddRange(parsed.Dependencies);
                    allRuntimes.AddRange(parsed.Runtimes);
                }
            }

            HashSet<(DependencyEcosystem Ecosystem, string Name)> lockedPackages = lockDeps
                .Select(d => (d.Ecosystem, d.Name.ToLowerInvariant()))
                .ToHashSet();

            List<Dependency> dedupedDeps = lockDeps
                .Concat(manifestDeps.Where(d => !lockedPackages.Contains((d.Ecosystem, d.Name.ToLowerInvariant()))))
                .GroupBy(d => (d.Ecosystem, Name: d.Name.ToLowerInvariant(), d.CurrentVersion))
                .Select(g => g.OrderBy(d => d.Type).First())
                .ToList();

            List<Runtime> dedupedRuntimes = allRuntimes
                .GroupBy(r => (Name: r.Name.ToLowerInvariant(), r.Version))
                .Select(g => g.First())
                .ToList();

            await registry.FetchLatestVersionsAsync(dedupedDeps);

            foreach (Dependency dep in dedupedDeps)
                dep.Status = DependencyStatusCalculator.Compute(dep.CurrentVersion, dep.LatestVersion);

            return new ScanOutcome(dedupedDeps, dedupedRuntimes, null, manifestsRead);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Repository {RepoUrl} scan failed", repoUrl);
            return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                ErrorCodes.ScanFailed);
        }
    }

}
