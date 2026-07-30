using Microsoft.Extensions.Logging;
using Sentinel.Domain.Versioning;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Git;
using Sentinel.Domain.Models;

namespace Sentinel.Application.TechHealth.Scan;

public record ScanOutcome(List<Dependency> Dependencies, List<Runtime> Runtimes, string? Error, int ManifestsRead = 0);

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
                    "URL du dépôt invalide.");
            }

            (string host, string owner, string repo) = (location.Host, location.Owner, location.Repository);
            List<(string Name, string Url)> files = await hostClient.ListFilesAsync(host, owner, repo, tokenOverride);

            if (files.Count == 0)
            {
                return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                    "Aucun fichier accessible dans le dépôt (dépôt privé sans token valide, token expiré, ou limite de requêtes atteinte).");
            }

            List<Dependency> manifestDeps = new();
            List<Dependency> lockDeps = new();
            List<Runtime> allRuntimes = new();

            List<(string Name, string Url)> discoveredManifests = files
                .Where(f => ManifestParserService.IsManifest(f.Name))
                .ToList();

            List<(string Name, string Url)> manifestFiles = discoveredManifests
                .Take(MaxManifestFiles)
                .ToList();

            if (discoveredManifests.Count > MaxManifestFiles)
            {
                logger.LogWarning(
                    "Dépôt {RepoUrl} : {Total} manifestes détectés, seuls les {Max} premiers sont analysés",
                    repoUrl, discoveredManifests.Count, MaxManifestFiles);
            }

            using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentDownloads);
            Lock parseGate = new Lock();
            int manifestsRead = 0;

            await Task.WhenAll(manifestFiles.Select(async file =>
            {
                string? content;

                await throttle.WaitAsync();
                try { content = await hostClient.FetchTextAsync(host, file.Url, tokenOverride); }
                finally { throttle.Release(); }

                if (content == null) return;

                (List<Dependency> deps, List<Runtime> rts) = parser.Parse(projectId, file.Name, content);
                bool isLockFile = ManifestParserService.IsLockFile(file.Name);

                lock (parseGate)
                {
                    manifestsRead++;

                    if (isLockFile)
                    {
                        lockDeps.AddRange(deps);
                    }
                    else
                    {
                        manifestDeps.AddRange(deps);
                        allRuntimes.AddRange(rts);
                    }
                }
            }));

            HashSet<string> lockNames = lockDeps
                .Select(d => d.Name.ToLowerInvariant())
                .ToHashSet();

            List<Dependency> dedupedDeps = lockDeps
                .Concat(manifestDeps.Where(d => !lockNames.Contains(d.Name.ToLowerInvariant())))
                .GroupBy(d => d.Name, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .ToList();

            List<Runtime> dedupedRuntimes = allRuntimes
                .GroupBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .ToList();

            await registry.FetchLatestVersionsAsync(dedupedDeps);

            foreach (Dependency dep in dedupedDeps)
                dep.Status = DependencyStatusCalculator.Compute(dep.CurrentVersion, dep.LatestVersion);

            return new ScanOutcome(dedupedDeps, dedupedRuntimes, null, manifestsRead);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Erreur lors du scan du dépôt {RepoUrl}", repoUrl);
            return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                "Échec du scan du dépôt. Vérifiez l'URL, l'accès et le token de l'organisation.");
        }
    }

}
