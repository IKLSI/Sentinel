namespace Sentinel.Domain.Constants;

public static class RepositoryHosts
{
    public const string PublicGitLabBaseUrl = "https://gitlab.com";

    public static readonly HashSet<string> GitHubHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "github.com",
        "www.github.com",
    };

    public static readonly HashSet<string> AllowedPublicHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "github.com",
        "www.github.com",
        "gitlab.com",
        "www.gitlab.com",
    };

    public static bool IsGitHub(string host) => GitHubHosts.Contains(host);

    public static bool IsGitLab(string host, string gitLabHost) =>
        string.Equals(host, gitLabHost, StringComparison.OrdinalIgnoreCase)
        || string.Equals(host, $"www.{gitLabHost}", StringComparison.OrdinalIgnoreCase);

    public static bool IsSupported(string host, string gitLabHost) => IsGitHub(host) || IsGitLab(host, gitLabHost);
}
