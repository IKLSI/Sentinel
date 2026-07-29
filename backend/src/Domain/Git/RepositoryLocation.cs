namespace Sentinel.Domain.Git;

public readonly record struct RepositoryLocation(string Host, string Owner, string Repository)
{
    public static bool TryParse(string? url, out RepositoryLocation location)
    {
        location = default;

        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!Uri.TryCreate(url.TrimEnd('/'), UriKind.Absolute, out Uri? uri)) return false;

        string[] segments = uri.AbsolutePath.Trim('/').Split('/');

        if (segments.Length < 2) return false;

        location = new RepositoryLocation(
            uri.Host.ToLowerInvariant(),
            segments[0],
            segments[1].EndsWith(".git", StringComparison.OrdinalIgnoreCase)
                ? segments[1][..^".git".Length]
                : segments[1]);

        return true;
    }
}
