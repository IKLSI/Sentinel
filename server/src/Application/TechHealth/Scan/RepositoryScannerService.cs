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

internal record ParsedManifest(string FileName, string Directory, bool IsLockFile, List<Dependency> Dependencies,
    List<Runtime> Runtimes, LockGraph? Graph = null);

public class RepositoryScannerService(
    IRepositoryHostClient hostClient,
    ManifestParserService parser,
    RegistryMetadataApplier registryMetadata,
    ILogger<RepositoryScannerService> logger)
{
    private const int MaxConcurrentDownloads = 10;
    private const int MaxManifestFiles = 200;

    private static void ApplyDeclaredTypes(List<Dependency> lockDeps, List<Dependency> manifestDeps)
    {
        if (lockDeps.Count == 0 || manifestDeps.Count == 0) return;

        Dictionary<(DependencyEcosystem, string), DependencyType> declaredTypes = manifestDeps
            .GroupBy(DependencyIdentity.Of)
            .ToDictionary(
                group => group.Key,
                group => group.Any(d => d.Type == DependencyType.Prod)
                    ? DependencyType.Prod
                    : DependencyType.Dev);

        foreach (Dependency dependency in lockDeps)
        {
            if (declaredTypes.TryGetValue(DependencyIdentity.Of(dependency), out DependencyType declared))
            {
                dependency.Type = declared;
            }
        }
    }

    private static void ApplyTransitiveDevTypes(ParsedManifest lockFile, List<Dependency> manifestDeps)
    {
        if (lockFile.Graph == null || manifestDeps.Count == 0) return;

        HashSet<string> productionRoots = RootNames(manifestDeps, DependencyType.Prod);
        HashSet<string> developmentRoots = RootNames(manifestDeps, DependencyType.Dev);

        HashSet<string> productionReachable = lockFile.Graph.ReachableFrom(SeedsOf(lockFile, productionRoots));
        HashSet<string> developmentReachable = lockFile.Graph.ReachableFrom(SeedsOf(lockFile, developmentRoots));

        if (productionRoots.Count > 0 && productionReachable.Count == 0) return;

        foreach (Dependency dependency in lockFile.Dependencies)
        {
            string node = LockGraph.NodeId(dependency.Name, dependency.CurrentVersion);

            if (developmentReachable.Contains(node) && !productionReachable.Contains(node))
                dependency.Type = DependencyType.Dev;
        }
    }

    private static HashSet<string> RootNames(List<Dependency> manifestDeps, DependencyType type) => manifestDeps
        .Where(d => d.Ecosystem == DependencyEcosystem.Npm && d.Type == type)
        .Select(d => d.Name)
        .ToHashSet(StringComparer.Ordinal);

    private static List<string> SeedsOf(ParsedManifest lockFile, HashSet<string> rootNames) => lockFile.Dependencies
        .Where(d => rootNames.Contains(d.Name))
        .Select(d => LockGraph.NodeId(d.Name, d.CurrentVersion))
        .ToList();

    private static void ApplyDirectness(ParsedManifest lockFile, List<Dependency> manifestDeps)
    {
        HashSet<DependencyEcosystem> declaredEcosystems = manifestDeps.Select(d => d.Ecosystem).ToHashSet();
        HashSet<(DependencyEcosystem, string)> directKeys = manifestDeps
            .Where(d => d.IsDirect)
            .Select(DependencyIdentity.Of)
            .ToHashSet();
        bool keepsParserDirectness = ManifestParserService.ReportsDirectness(lockFile.FileName);

        foreach (Dependency dependency in lockFile.Dependencies)
        {
            if (declaredEcosystems.Contains(dependency.Ecosystem))
                dependency.IsDirect = directKeys.Contains(DependencyIdentity.Of(dependency));
            else if (!keepsParserDirectness)
                dependency.IsDirect = false;
        }
    }

    public Task<string?> GetHeadCommitAsync(string repoUrl, RepositoryAccess? access, string? branch,
        CancellationToken cancellationToken)
    {
        if (!RepositoryLocation.TryParse(repoUrl, out RepositoryLocation location))
            return Task.FromResult<string?>(null);

        return hostClient.GetHeadCommitAsync(location.Host, location.Owner, location.Repository, access, branch,
            cancellationToken);
    }

    public async Task RefreshVersionsAsync(List<Dependency> dependencies, CancellationToken cancellationToken)
    {
        if (dependencies.Count == 0) return;

        await registryMetadata.ApplyAsync(RegistryCandidates(dependencies), cancellationToken);

        foreach (Dependency dependency in dependencies)
            dependency.Status = DependencyStatusCalculator.For(dependency);
    }

    public async Task<ScanOutcome> ScanRepositoryAsync(Guid projectId, string repoUrl, RepositoryAccess? access,
        string? commitSha, RepositoryScanScope? scope, CancellationToken cancellationToken)
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
            string? reference = string.IsNullOrEmpty(commitSha) ? effectiveScope.Branch : commitSha;
            RepositoryFileListing listing = await hostClient.ListFilesAsync(host, owner, repo, access,
                reference, cancellationToken);

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

                await throttle.WaitAsync(cancellationToken);
                try { content = await hostClient.FetchTextAsync(host, file.Url, access, cancellationToken); }
                finally { throttle.Release(); }

                if (content == null)
                {
                    Interlocked.Increment(ref unreadableFiles);
                    return null;
                }

                try
                {
                    ManifestParseOutcome outcome = parser.ParseReportingFailure(projectId, file.Name, content);

                    if (outcome.Failure != null)
                    {
                        Interlocked.Increment(ref unreadableFiles);
                        logger.LogWarning(outcome.Failure, "Manifest {Path} is malformed, only its readable part is kept",
                            file.Path);
                    }

                    foreach (Dependency dependency in outcome.Dependencies) dependency.ManifestPath = file.Path;

                    LockGraph? graph = ManifestParserService.HasLockGraph(file.Name)
                        ? parser.ParseLockGraph(file.Name, content)
                        : null;

                    return new ParsedManifest(file.Name, RepositoryScanPaths.DirectoryOf(file.Path),
                        ManifestParserService.IsLockFile(file.Name), outcome.Dependencies, outcome.Runtimes, graph);
                }
                catch (Exception ex)
                {
                    Interlocked.Increment(ref unreadableFiles);
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
                ApplyTransitiveDevTypes(lockFile, coveredManifestDeps);
                ApplyDirectness(lockFile, coveredManifestDeps);
            }

            List<LockedPackages> lockedPackages = lockFiles.Select(LockedPackages.Of).ToList();

            List<Dependency> unlockedManifestDeps = manifests
                .SelectMany(manifest => manifest.Dependencies
                    .Where(dependency => !IsLocked(dependency, manifest.Directory, lockedPackages)))
                .ToList();

            List<Dependency> dedupedDeps = lockFiles.SelectMany(lockFile => lockFile.Dependencies)
                .Concat(unlockedManifestDeps)
                .GroupBy(d => (Identity: DependencyIdentity.Of(d), d.CurrentVersion))
                .Select(g => g.OrderBy(d => d.Type).ThenByDescending(d => d.IsDirect).First())
                .ToList();

            List<Runtime> dedupedRuntimes = manifests.SelectMany(manifest => manifest.Runtimes)
                .Where(r => !string.IsNullOrWhiteSpace(r.Version))
                .GroupBy(r => (Name: r.Name.ToLowerInvariant(), Version: r.Version.Trim()))
                .Select(g => g.OrderBy(r => r.IsMinimumConstraint).First())
                .OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
                .ThenBy(r => r.Version, StringComparer.OrdinalIgnoreCase)
                .ToList();

            await registryMetadata.ApplyAsync(RegistryCandidates(dedupedDeps), cancellationToken);

            foreach (Dependency dep in dedupedDeps)
                dep.Status = DependencyStatusCalculator.For(dep);

            return new ScanOutcome(dedupedDeps, dedupedRuntimes, null, parsed.Count, isComplete);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Repository {RepoUrl} scan failed", repoUrl);
            return new ScanOutcome(new List<Dependency>(), new List<Runtime>(),
                ErrorCodes.ScanFailed);
        }
    }

    private static List<Dependency> RegistryCandidates(IEnumerable<Dependency> dependencies) =>
        dependencies.Where(dependency => dependency.IsDirect).ToList();

    private static bool IsLocked(Dependency dependency, string manifestDirectory,
        List<LockedPackages> lockedPackages) =>
        lockedPackages.Any(locked => RepositoryScanPaths.Covers(locked.Directory, manifestDirectory)
            && locked.Contains(dependency));

    private sealed record LockedPackages(string Directory, HashSet<(DependencyEcosystem, string)> Packages)
    {
        public static LockedPackages Of(ParsedManifest lockFile) => new(lockFile.Directory,
            lockFile.Dependencies.Select(DependencyIdentity.Of).ToHashSet());

        public bool Contains(Dependency dependency) => Packages.Contains(DependencyIdentity.Of(dependency));
    }
}
