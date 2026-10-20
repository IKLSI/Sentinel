namespace Sentinel.Domain.TechHealth;

public static class RepositoryScanPaths
{
    public const int MaxRootPathLength = 500;

    private static readonly HashSet<string> ExcludedDirectories = new(StringComparer.OrdinalIgnoreCase)
    {
        "fixtures", "__fixtures__", "testdata", "test-data", "examples", "example", "samples", "sample",
        "docs", "__mocks__", "__snapshots__",
    };

    public static string? NormalizeRootPath(string? rootPath)
    {
        if (string.IsNullOrWhiteSpace(rootPath)) return null;

        string normalized = rootPath.Trim().Replace('\\', '/').Trim('/');

        return normalized.Length == 0 ? null : normalized;
    }

    public static bool IsValidRootPath(string? rootPath)
    {
        string? normalized = NormalizeRootPath(rootPath);

        return normalized == null
            || (normalized.Length <= MaxRootPathLength
                && normalized.Split('/').All(segment => segment.Length > 0 && segment != "." && segment != ".."));
    }

    public static bool IsInScope(string path, string? rootPath)
    {
        string normalizedPath = path.Replace('\\', '/').TrimStart('/');

        if (rootPath != null && !normalizedPath.StartsWith(rootPath + "/", StringComparison.OrdinalIgnoreCase))
            return false;

        string relative = rootPath == null ? normalizedPath : normalizedPath[(rootPath.Length + 1)..];
        string[] segments = relative.Split('/');

        return !segments[..^1].Any(ExcludedDirectories.Contains);
    }

    public static string DirectoryOf(string path)
    {
        string normalized = path.Replace('\\', '/').TrimStart('/');
        int separator = normalized.LastIndexOf('/');

        return separator < 0 ? string.Empty : normalized[..separator];
    }

    public static List<string> ProjectDirectories(IEnumerable<string> manifestPaths) =>
        manifestPaths
            .Where(path => IsInScope(path, null))
            .Select(DirectoryOf)
            .Where(directory => directory.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToList();

    public static bool Covers(string lockDirectory, string manifestDirectory) =>
        lockDirectory.Length == 0
        || manifestDirectory.Equals(lockDirectory, StringComparison.OrdinalIgnoreCase)
        || manifestDirectory.StartsWith(lockDirectory + "/", StringComparison.OrdinalIgnoreCase);
}
