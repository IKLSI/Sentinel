using Microsoft.Extensions.Logging;
using TMAflow.Domain.Models;

namespace TMAflow.Application.Services;

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

    public async Task<(List<Dependency>, List<Runtime>)> ScanRepositoryAsync(Guid projectId, string repoUrl)
    {
        try
        {
            (string? host, string? owner, string? repo) = ParseRepoUrl(repoUrl);
            List<(string Name, string Url)> files = await _hostClient.ListFilesAsync(host, owner, repo);

            List<Dependency> allDeps = new List<Dependency>();
            List<Runtime> allRuntimes = new List<Runtime>();

            foreach ((string? fileName, string? url) in files)
            {
                if (!ManifestParserService.IsManifest(fileName)) continue;
                string? content = await _hostClient.FetchTextAsync(host, url);
                if (content == null) continue;

                (List<Dependency>? deps, List<Runtime>? rts) = _parser.Parse(projectId, fileName, content);
                allDeps.AddRange(deps);
                allRuntimes.AddRange(rts);
            }

            List<Dependency> dedupedDeps = allDeps
                .GroupBy(d => d.Name, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .ToList();

            List<Runtime> dedupedRuntimes = allRuntimes
                .GroupBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .ToList();

            await _registry.FetchLatestVersionsAsync(dedupedDeps);

            foreach (Dependency? dep in dedupedDeps)
                dep.Status = DependencyRegistryClient.ComputeStatus(dep.CurrentVersion, dep.LatestVersion);

            return (dedupedDeps, dedupedRuntimes);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors du scan du dépôt {RepoUrl}", repoUrl);
            return (new List<Dependency>(), new List<Runtime>());
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
