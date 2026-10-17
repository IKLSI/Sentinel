using Sentinel.Domain.Constants;

namespace Sentinel.Domain.Git;

public readonly record struct RepositoryLocation(string Host, string Owner, string Repository)
{
    private const string GitSuffix = ".git";
    private const string GitLabRouteSeparator = "-";

    public static bool TryParse(string? url, out RepositoryLocation location)
    {
        location = default;

        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!Uri.TryCreate(url.TrimEnd('/'), UriKind.Absolute, out Uri? uri)) return false;

        string host = uri.Host.ToLowerInvariant();
        string[] segments = RepositorySegments(host, uri.AbsolutePath.Trim('/').Split('/'));

        if (segments.Length < 2) return false;

        string repository = segments[^1];

        location = new RepositoryLocation(
            host,
            string.Join('/', segments[..^1]),
            repository.EndsWith(GitSuffix, StringComparison.OrdinalIgnoreCase)
                ? repository[..^GitSuffix.Length]
                : repository);

        return true;
    }

    private static string[] RepositorySegments(string host, string[] segments)
    {
        if (RepositoryHosts.GitHubHosts.Contains(host)) return segments.Take(2).ToArray();

        int routeIndex = Array.IndexOf(segments, GitLabRouteSeparator);

        return routeIndex < 0 ? segments : segments[..routeIndex];
    }
}
