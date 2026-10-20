using Microsoft.Extensions.Logging;
using Sentinel.Domain.Versioning;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Git;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Scan;

public record ScanOutcome(List<Dependency> Dependencies, List<Runtime> Runtimes, string? Error, int ManifestsRead = 0,
    bool IsComplete = true);

public sealed record RepositoryScanScope(string? Branch, string? RootPath)
{
    public static readonly RepositoryScanScope Default = new(null, null);
}

internal record ParsedManifest(string Directory, bool IsLockFile, List<Dependency> Dependencies, List<Runtime> Runtimes);

public class RepositoryScannerService(
    IRepositoryHostClient hostClient,
    ManifestParserService parser,
    IDependencyRegistryClient registry,
    ILogger<RepositoryScannerService> logger)
{
    private const int MaxConcurrentDownloads = 10;
    private const int MaxManifestFiles = 200;

    private static void ApplyDeclaredTypes(List<Dependency> lockDeps, List<Dependency> manifestDeps)
    {
        if (lockDeps.Count == 0 || manifestDeps.Count == 0) return;

        Dictionary<(DependencyEcosystem, string), DependencyType> declaredTypes = manifestDeps
            .GroupBy(d => (d.Ecosystem, d.Name.ToLowerInvariant()))
            .ToDictionary(
                group => group.Key,
                group => group.Any(d => d.Type == DependencyType.Prod)
                    ? DependencyType.Prod
                    : DependencyType.Dev);

        foreach (Dependency dependency in lockDeps)
        {
            if (declaredTypes.TryGetValue((dependency.Ecosystem, dependency.Name.ToLowerInvariant()),
                out DependencyType declared))
            {
                dependency.Type = declared;
            }
        }
    }

    private static void ApplyDirectness(List<Dependency> lockDeps, List<Dependency> manifestDeps)
    {
        Dictionary<DependencyEcosystem, HashSet<string>> directNamesByEcosystem = manifestDeps
            .Where(d => d.IsDirect)
            .GroupBy(d => d.Ecosystem)
            .ToDictionary(
                group => group.Key,
                group => group.Select(DirectnessKey).ToHashSet());

        foreach (Dependency dependency in lockDeps)
        {
            if (directNamesByEcosystem.TryGetValue(dependency.Ecosystem, out HashSet<string>? directNames))
                dependency.IsDirect = directNames.Contains(DirectnessKey(dependency));
        }
    }

    private static string DirectnessKey(Dependency dependency) =>
        PackageNameNormalizer.ForVulnerabilityFeed(dependency.Ecosystem, dependency.Name).ToLowerInvariant();

    public Task<string?> GetHeadCommitAsync(string repoUrl, RepositoryAccess? access = null, string? branch = null)
    {
        if (!RepositoryLocation.TryParse(repoUrl, out RepositoryLocation location))
            return Task.FromResult<string?>(null);

        return hostClient.GetHeadCommitAsync(location.Host, location.Owner, location.Repository, access, branch);
    }

    public async Task RefreshVersionsAsync(List<Dependency> dependencies)
    {
        if (dependencies.Count == 0) return;

        await registry.FetchRegistryMetadataAsync(RegistryCandidates(dependencies));

        foreach (Dependency dependency in dependencies)
            dependency.Status = DependencyStatusCalculator.For(dependency);
    }

    public async Task<ScanOutcome> ScanRepositoryAsync(Guid projectId, string repoUrl, RepositoryAccess? access = null,
        string? commitSha = null, RepositoryScanScope? scope = null)
    {
        RepositoryScanScope effectiveScope = scope ?? RepositoryScanScope.Default;
        string? rootPath = RepositoryScanPaths.NormalizeRootPath(effectiveScope.RootPath);

        try
        {
            if (!RepositoryLocation.TryParse(repoUrl, out RepositoryLocation location))
            {
                return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                    ErrorCodes.ScanInvalidRepositoryUrl);
            }

            (string host, string owner, string repo) = (location.Host, location.Owner, location.Repository);
            RepositoryFileListing listing = await hostClient.ListFilesAsync(host, owner, repo, access,
                commitSha);

            if (listing.Files.Count == 0)
            {
                return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                    ErrorCodes.ScanNoAccessibleFiles);
            }

            List<(string Name, string Url, string Path)> discoveredManifests = listing.Files
                .Where(f => RepositoryScanPaths.IsInScope(f.Path, rootPath)
                    || (rootPath != null && ManifestParserService.IsWorkflowFile(f.Url)))
                .Select(f => (Name: ManifestParserService.IsWorkflowFile(f.Url) ? ManifestParserService.WorkflowFileName : f.Name, f.Url, f.Path))
                .Where(f => f.Name == ManifestParserService.WorkflowFileName || ManifestParserService.IsManifest(f.Name))
                .OrderBy(f => ManifestParserService.ScanPriority(f.Name))
                .ToList();

            List<(string Name, string Url, string Path)> manifestFiles = discoveredManifests
                .Take(MaxManifestFiles)
                .ToList();

            if (discoveredManifests.Count > MaxManifestFiles)
            {
                logger.LogWarning(
                    "Repository {RepoUrl}: {Total} manifests detected, only the first {Max} are analyzed",
                    repoUrl, discoveredManifests.Count, MaxManifestFiles);
            }

            using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentDownloads);
            int unreadableFiles = 0;

            ParsedManifest?[] parsedManifests = await Task.WhenAll(manifestFiles.Select(async file =>
            {
                string? content;

                await throttle.WaitAsync();
                try { content = await hostClient.FetchTextAsync(host, file.Url, access); }
                finally { throttle.Release(); }

                if (content == null)
                {
                    Interlocked.Increment(ref unreadableFiles);
                    return null;
                }

                try
                {
                    (List<Dependency> deps, List<Runtime> rts) = parser.Parse(projectId, file.Name, content);

                    foreach (Dependency dependency in deps) dependency.ManifestPath = file.Path;

                    return new ParsedManifest(RepositoryScanPaths.DirectoryOf(file.Path),
                        ManifestParserService.IsLockFile(file.Name), deps, rts);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Manifest {File} could not be parsed and is ignored", file.Name);
                    return null;
                }
            }));

            bool isComplete = !listing.Truncated
                && discoveredManifests.Count <= MaxManifestFiles
                && unreadableFiles == 0;

            if (!isComplete)
            {
                logger.LogWarning(
                    "Repository {RepoUrl}: inventory incomplete (truncated listing, manifest cap or unreadable files)",
                    repoUrl);
            }

            List<ParsedManifest> parsed = parsedManifests.OfType<ParsedManifest>().ToList();
            List<ParsedManifest> lockFiles = parsed.Where(manifest => manifest.IsLockFile).ToList();
            List<ParsedManifest> manifests = parsed.Where(manifest => !manifest.IsLockFile).ToList();

            foreach (ParsedManifest lockFile in lockFiles)
            {
                List<Dependency> coveredManifestDeps = manifests
                    .Where(manifest => RepositoryScanPaths.Covers(lockFile.Directory, manifest.Directory))
                    .SelectMany(manifest => manifest.Dependencies)
                    .ToList();

                ApplyDeclaredTypes(lockFile.Dependencies, coveredManifestDeps);
                ApplyDirectness(lockFile.Dependencies, coveredManifestDeps);
            }

            List<Dependency> unlockedManifestDeps = manifests
                .SelectMany(manifest => manifest.Dependencies
                    .Where(dependency => !IsLocked(dependency, manifest.Directory, lockFiles)))
                .ToList();

            List<Dependency> dedupedDeps = lockFiles.SelectMany(lockFile => lockFile.Dependencies)
                .Concat(unlockedManifestDeps)
                .GroupBy(d => (d.Ecosystem, Name: d.Name.ToLowerInvariant(), d.CurrentVersion))
                .Select(g => g.OrderBy(d => d.Type).ThenByDescending(d => d.IsDirect).First())
                .ToList();

            List<Runtime> dedupedRuntimes = manifests.SelectMany(manifest => manifest.Runtimes)
                .Where(r => !string.IsNullOrWhiteSpace(r.Version))
                .GroupBy(r => (Name: r.Name.ToLowerInvariant(), Version: r.Version.Trim()))
                .Select(g => g.OrderBy(r => r.IsMinimumConstraint).First())
                .OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
                .ThenBy(r => r.Version, StringComparer.OrdinalIgnoreCase)
                .ToList();

            await registry.FetchRegistryMetadataAsync(RegistryCandidates(dedupedDeps));

            foreach (Dependency dep in dedupedDeps)
                dep.Status = DependencyStatusCalculator.For(dep);

            return new ScanOutcome(dedupedDeps, dedupedRuntimes, null, parsed.Count, isComplete);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Repository {RepoUrl} scan failed", repoUrl);
            return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                ErrorCodes.ScanFailed);
        }
    }

    private static List<Dependency> RegistryCandidates(IEnumerable<Dependency> dependencies) =>
        dependencies.Where(dependency => dependency.IsDirect).ToList();

    private static bool IsLocked(Dependency dependency, string manifestDirectory, List<ParsedManifest> lockFiles) =>
        lockFiles.Any(lockFile => RepositoryScanPaths.Covers(lockFile.Directory, manifestDirectory)
            && lockFile.Dependencies.Any(locked => locked.Ecosystem == dependency.Ecosystem
                && locked.Name.Equals(dependency.Name, StringComparison.OrdinalIgnoreCase)));
}
