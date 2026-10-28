using System.Collections.Concurrent;
using System.Globalization;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.TechHealth;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.Scanning;

public sealed record InventoryGap(string Code, string? Detail = null);

public record ScanOutcome(List<Dependency> Dependencies, List<Runtime> Runtimes, string? Error, int ManifestsRead = 0,
    InventoryGap? Gap = null)
{
    public bool IsComplete => Gap == null;
}

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

    private sealed record ManifestFile(string Name, string Url, string Path);

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
            dependency.Status = dependency.Vulnerabilities.Count > 0
                ? DependencyStatus.Vulnerable
                : DependencyStatusCalculator.For(dependency);
    }

    public async Task<ScanOutcome> ScanRepositoryAsync(Guid projectId, string repoUrl, RepositoryAccess? access,
        string? commitSha, RepositoryScanScope? scope, CancellationToken cancellationToken,
        IProgress<ScanStage>? progress = null)
    {
        RepositoryScanScope effectiveScope = scope ?? RepositoryScanScope.Default;
        string? rootPath = RepositoryScanPaths.NormalizeRootPath(effectiveScope.RootPath);

        try
        {
            if (!RepositoryLocation.TryParse(repoUrl, out RepositoryLocation location))
                return FailedScan(ErrorCodes.ScanInvalidRepositoryUrl);

            string? reference = string.IsNullOrEmpty(commitSha) ? effectiveScope.Branch : commitSha;
            RepositoryFileListing listing = await hostClient.ListFilesAsync(location.Host, location.Owner,
                location.Repository, access, reference, cancellationToken);

            if (listing.Files.Count == 0) return FailedScan(ErrorCodes.ScanNoAccessibleFiles);

            progress?.Report(ScanStage.Manifests);

            ScanOutcome inventory = await ReadInventoryAsync(projectId, repoUrl, location.Host, listing, rootPath,
                access, cancellationToken);

            progress?.Report(ScanStage.Registries);
            await registryMetadata.ApplyAsync(RegistryCandidates(inventory.Dependencies), cancellationToken);

            foreach (Dependency dep in inventory.Dependencies)
                dep.Status = DependencyStatusCalculator.For(dep);

            return inventory;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Repository {RepoUrl} scan failed", repoUrl);
            return FailedScan(ErrorCodes.ScanFailed);
        }
    }

    public async Task<ScanOutcome> ReadInventoryAsync(Guid projectId, string repoUrl, string host,
        RepositoryFileListing listing, string? rootPath, RepositoryAccess? access,
        CancellationToken cancellationToken)
    {
        (List<ParsedManifest> parsed, InventoryGap? gap) = await ParseRepositoryManifestsAsync(projectId,
            repoUrl, host, listing, RepositoryScanPaths.NormalizeRootPath(rootPath), access, cancellationToken);

        (List<Dependency> dependencies, List<Runtime> runtimes) = MergeInventory(parsed);

        return new ScanOutcome(dependencies, runtimes, null, parsed.Count, gap);
    }

    private async Task<(List<ParsedManifest> Parsed, InventoryGap? Gap)> ParseRepositoryManifestsAsync(
        Guid projectId, string repoUrl, string host, RepositoryFileListing listing, string? rootPath,
        RepositoryAccess? access, CancellationToken cancellationToken)
    {
        List<ManifestFile> discoveredManifests = DiscoverManifests(listing, rootPath);
        if (discoveredManifests.Count > MaxManifestFiles)
        {
            logger.LogWarning(
                "Repository {RepoUrl}: {Total} manifests detected, only the first {Max} are analyzed",
                repoUrl, discoveredManifests.Count, MaxManifestFiles);
        }

        using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentDownloads);
        ConcurrentQueue<string> unreadableFiles = new();

        ParsedManifest?[] parsedManifests = await Task.WhenAll(discoveredManifests.Take(MaxManifestFiles)
            .Select(file => ParseManifestAsync(projectId, host, file, access, throttle, unreadableFiles,
                cancellationToken)));

        InventoryGap? gap = InventoryGapOf(listing.Truncated, discoveredManifests.Count, unreadableFiles);
        if (gap != null)
        {
            logger.LogWarning(
                "Repository {RepoUrl}: inventory incomplete (truncated listing, manifest cap or unreadable files)",
                repoUrl);
        }

        return (parsedManifests.OfType<ParsedManifest>().ToList(), gap);
    }

    private static ScanOutcome FailedScan(string errorCode) =>
        new(new List<Dependency>(), new List<Runtime>(), errorCode);

    private static List<ManifestFile> DiscoverManifests(RepositoryFileListing listing, string? rootPath) =>
        listing.Files
            .Select(f => (File: f, IsWorkflow: ManifestParserService.IsWorkflowFile(f.Url)))
            .Where(f => RepositoryScanPaths.IsInScope(f.File.Path, rootPath) || (rootPath != null && f.IsWorkflow))
            .Select(f => new ManifestFile(f.IsWorkflow ? ManifestParserService.WorkflowFileName : f.File.Name,
                f.File.Url, f.File.Path))
            .Where(f => f.Name == ManifestParserService.WorkflowFileName || ManifestParserService.IsManifest(f.Name))
            .OrderBy(f => ManifestParserService.ScanPriority(f.Name))
            .ToList();

    private async Task<ParsedManifest?> ParseManifestAsync(Guid projectId, string host, ManifestFile file,
        RepositoryAccess? access, SemaphoreSlim throttle, ConcurrentQueue<string> unreadableFiles,
        CancellationToken cancellationToken)
    {
        string? content;

        await throttle.WaitAsync(cancellationToken);
        try { content = await hostClient.FetchTextAsync(host, file.Url, access, cancellationToken); }
        finally { throttle.Release(); }

        if (content == null)
        {
            unreadableFiles.Enqueue(file.Path);
            return null;
        }

        try
        {
            ManifestParseOutcome outcome = parser.ParseReportingFailure(projectId, file.Name, content);

            if (outcome.Failure != null)
            {
                unreadableFiles.Enqueue(file.Path);
                logger.LogWarning(outcome.Failure, "Manifest {Path} is malformed, only its readable part is kept",
                    file.Path);
            }

            foreach (Dependency dependency in outcome.Dependencies) dependency.ManifestPath = file.Path;

            return new ParsedManifest(file.Name, RepositoryScanPaths.DirectoryOf(file.Path),
                ManifestParserService.IsLockFile(file.Name), outcome.Dependencies, outcome.Runtimes, outcome.Graph);
        }
        catch (Exception ex)
        {
            unreadableFiles.Enqueue(file.Path);
            logger.LogWarning(ex, "Manifest {File} could not be parsed and is ignored", file.Name);
            return null;
        }
    }

    private static List<Dependency> RegistryCandidates(IEnumerable<Dependency> dependencies) =>
        dependencies.Where(dependency => dependency.IsDirect).ToList();

    private const int MaxGapPathLength = 300;

    private static InventoryGap? InventoryGapOf(bool listingTruncated, int discoveredManifests,
        IReadOnlyCollection<string> unreadableFiles)
    {
        if (listingTruncated) return new InventoryGap(ErrorCodes.ScanInventoryTruncated);

        if (discoveredManifests > MaxManifestFiles)
            return new InventoryGap(ErrorCodes.ScanInventoryManifestCap,
                discoveredManifests.ToString(CultureInfo.InvariantCulture));

        if (unreadableFiles.Count == 0) return null;

        string firstFile = unreadableFiles.Order(StringComparer.Ordinal).First();
        if (firstFile.Length > MaxGapPathLength) firstFile = $"…{firstFile[^MaxGapPathLength..]}";
        string detail = unreadableFiles.Count == 1 ? firstFile : $"{firstFile} (+{unreadableFiles.Count - 1})";
        return new InventoryGap(ErrorCodes.ScanInventoryUnreadableFile, detail);
    }

    private static (List<Dependency> Dependencies, List<Runtime> Runtimes) MergeInventory(List<ParsedManifest> parsed)
    {
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

        return (MergeDependencies(lockFiles, manifests), MergeRuntimes(manifests));
    }

    private static List<Dependency> MergeDependencies(List<ParsedManifest> lockFiles, List<ParsedManifest> manifests)
    {
        List<LockedPackages> lockedPackages = lockFiles.Select(LockedPackages.Of).ToList();

        List<Dependency> unlockedManifestDeps = manifests
            .SelectMany(manifest => manifest.Dependencies
                .Where(dependency => !IsLocked(dependency, manifest.Directory, lockedPackages)))
            .ToList();

        return lockFiles.SelectMany(lockFile => lockFile.Dependencies)
            .Concat(unlockedManifestDeps)
            .GroupBy(d => (Identity: DependencyIdentity.Of(d), d.CurrentVersion))
            .Select(MostSignificantOccurrence)
            .ToList();
    }

    private static Dependency MostSignificantOccurrence(IEnumerable<Dependency> occurrences)
    {
        List<Dependency> candidates = occurrences.ToList();
        Dependency kept = candidates.OrderBy(d => d.Type).ThenByDescending(d => d.IsDirect).First();
        kept.IsDirect = candidates.Any(d => d.IsDirect);
        return kept;
    }

    private static List<Runtime> MergeRuntimes(List<ParsedManifest> manifests) =>
        manifests.SelectMany(manifest => manifest.Runtimes)
            .Where(r => !string.IsNullOrWhiteSpace(r.Version))
            .GroupBy(r => (Name: r.Name.ToLowerInvariant(), Version: r.Version.Trim()))
            .Select(g => g.OrderBy(r => r.IsMinimumConstraint).First())
            .OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(r => r.Version, StringComparer.OrdinalIgnoreCase)
            .ToList();

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
                dependency.Type = declared;
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
