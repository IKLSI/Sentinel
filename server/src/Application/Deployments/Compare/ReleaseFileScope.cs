using Sentinel.Application.Scanning;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Deployments.Compare;

public sealed record ReleaseReadPlan(
    List<string> BaseManifests,
    List<string> HeadManifests,
    List<string> BaseConfiguration,
    List<string> HeadConfiguration,
    List<string> AddedMigrations);

public static class ReleaseFileScope
{
    private const int MaxInspectedMigrations = 30;
    private const int MaxConfigurationFiles = 20;

    public static bool TouchesDependencies(IEnumerable<RepositoryChangedFile> changed, string? rootPath) =>
        changed.Any(file => IsDependencyFile(file.Path) && InScope(file.Path, rootPath));

    public static ReleaseReadPlan Targeted(IReadOnlyCollection<RepositoryChangedFile> changed,
        IReadOnlyCollection<string> headPaths, string? rootPath)
    {
        List<RepositoryChangedFile> inScope = changed.Where(file => InScope(file.Path, rootPath)).ToList();
        HashSet<string> added = PathsWith(inScope, RepositoryFileChange.Added);
        HashSet<string> removed = PathsWith(inScope, RepositoryFileChange.Removed);
        List<string> changedDirectories = inScope
            .Where(file => IsDependencyFile(file.Path))
            .Select(file => RepositoryScanPaths.DirectoryOf(file.Path))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        List<string> headManifests = headPaths
            .Where(path => IsDependencyFile(path) && InScope(path, rootPath)
                && changedDirectories.Any(directory => AreRelated(directory, RepositoryScanPaths.DirectoryOf(path))))
            .ToList();
        List<string> removedManifests = removed.Where(IsDependencyFile).ToList();
        List<string> configuration = inScope
            .Where(file => ConfigurationDiff.IsConfigurationFile(Path.GetFileName(file.Path)))
            .Select(file => file.Path)
            .Take(MaxConfigurationFiles)
            .ToList();

        return new ReleaseReadPlan(
            [.. headManifests.Where(path => !added.Contains(path)), .. removedManifests],
            headManifests,
            configuration.Where(path => !added.Contains(path)).ToList(),
            configuration.Where(path => !removed.Contains(path)).ToList(),
            MigrationsAmong(added));
    }

    public static ReleaseReadPlan Full(IReadOnlyCollection<string> basePaths, IReadOnlyCollection<string> headPaths,
        string? rootPath)
    {
        HashSet<string> existing = basePaths.ToHashSet(StringComparer.Ordinal);

        return new ReleaseReadPlan(
            DependencyFiles(basePaths, rootPath),
            DependencyFiles(headPaths, rootPath),
            ConfigurationFiles(basePaths, rootPath),
            ConfigurationFiles(headPaths, rootPath),
            MigrationsAmong(headPaths.Where(path => !existing.Contains(path) && InScope(path, rootPath))));
    }

    public static bool IsDependencyFile(string path) =>
        ManifestParserService.IsManifest(Path.GetFileName(path)) || ManifestParserService.IsWorkflowFile(path);

    private static bool AreRelated(string changedDirectory, string directory) =>
        changedDirectory == directory
        || IsAncestor(changedDirectory, directory)
        || IsAncestor(directory, changedDirectory);

    private static bool IsAncestor(string ancestor, string directory) =>
        ancestor.Length == 0 || directory.StartsWith(ancestor + "/", StringComparison.Ordinal);

    private static HashSet<string> PathsWith(IEnumerable<RepositoryChangedFile> files, RepositoryFileChange change) =>
        files.Where(file => file.Change == change).Select(file => file.Path).ToHashSet(StringComparer.Ordinal);

    private static List<string> DependencyFiles(IEnumerable<string> paths, string? rootPath) =>
        paths.Where(path => IsDependencyFile(path) && InScope(path, rootPath)).ToList();

    private static List<string> ConfigurationFiles(IEnumerable<string> paths, string? rootPath) =>
        paths
            .Where(path => ConfigurationDiff.IsConfigurationFile(Path.GetFileName(path)) && InScope(path, rootPath))
            .Order(StringComparer.OrdinalIgnoreCase)
            .Take(MaxConfigurationFiles)
            .ToList();

    private static List<string> MigrationsAmong(IEnumerable<string> paths) =>
        paths
            .Where(MigrationInspector.IsMigrationFile)
            .Order(StringComparer.Ordinal)
            .Take(MaxInspectedMigrations)
            .ToList();

    private static bool InScope(string path, string? rootPath) =>
        RepositoryScanPaths.IsInScope(path, RepositoryScanPaths.NormalizeRootPath(rootPath));
}
