using Microsoft.Extensions.Logging;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public record ScanOutcome(List<Dependency> Dependencies, List<Runtime> Runtimes, string? Error);

public class RepositoryScannerService
{
    private readonly RepositoryHostClient _hostClient;
    private readonly ManifestParserService _parser;
    private readonly DependencyRegistryClient _registry;
    private readonly ILogger<RepositoryScannerService> _logger;

    public RepositoryScannerService(
        RepositoryHostClient hostClient,
        ManifestParserService parser,
        DependencyRegistryClient registry,
        ILogger<RepositoryScannerService> logger)
    {
        _hostClient = hostClient;
        _parser = parser;
        _registry = registry;
        _logger = logger;
    }

    public async Task<ScanOutcome> ScanRepositoryAsync(Guid projectId, string repoUrl, string? tokenOverride = null)
    {
        try
        {
            (string host, string owner, string repo) = ParseRepoUrl(repoUrl);
            List<(string Name, string Url)> files = await _hostClient.ListFilesAsync(host, owner, repo, tokenOverride);

            if (files.Count == 0)
            {
                return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                    "Aucun fichier accessible dans le dépôt (dépôt privé sans token valide, token expiré, ou limite de requêtes atteinte).");
            }

            List<Dependency> manifestDeps = new();
            List<Dependency> lockDeps = new();
            List<Runtime> allRuntimes = new();

            foreach ((string fileName, string url) in files)
            {
                if (!ManifestParserService.IsManifest(fileName)) continue;
                string? content = await _hostClient.FetchTextAsync(host, url, tokenOverride);
                if (content == null) continue;

                (List<Dependency> deps, List<Runtime> rts) = _parser.Parse(projectId, fileName, content);

                if (ManifestParserService.IsLockFile(fileName))
                {
                    lockDeps.AddRange(deps);
                }
                else
                {
                    manifestDeps.AddRange(deps);
                    allRuntimes.AddRange(rts);
                }
            }

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

            await _registry.FetchLatestVersionsAsync(dedupedDeps);

            foreach (Dependency dep in dedupedDeps)
                dep.Status = DependencyRegistryClient.ComputeStatus(dep.CurrentVersion, dep.LatestVersion);

            return new ScanOutcome(dedupedDeps, dedupedRuntimes, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors du scan du dépôt {RepoUrl}", repoUrl);
            return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                $"Échec du scan du dépôt : {ex.Message}");
        }
    }

    private static (string host, string owner, string repo) ParseRepoUrl(string url)
    {
        Uri uri = new Uri(url.TrimEnd('/'));
        string[] segments = uri.AbsolutePath.Trim('/').Split('/');
        if (segments.Length < 2)
            throw new ArgumentException($"URL de dépôt invalide : {url}");
        return (uri.Host.ToLowerInvariant(), segments[0], segments[1].Replace(".git", "", StringComparison.OrdinalIgnoreCase));
    }
}
