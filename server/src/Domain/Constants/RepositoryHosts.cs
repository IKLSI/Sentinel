namespace Sentinel.Domain.Constants;

public static class RepositoryHosts
{
    public static readonly HashSet<string> AllowedPublicHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "github.com",
        "www.github.com",
        "gitlab.com",
        "www.gitlab.com",
    };
}
