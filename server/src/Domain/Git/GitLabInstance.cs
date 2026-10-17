using Sentinel.Domain.Constants;

namespace Sentinel.Domain.Git;

public sealed record GitLabInstance(string BaseUrl)
{
    public static readonly GitLabInstance Public = new(RepositoryHosts.PublicGitLabBaseUrl);

    public string Host => new Uri(BaseUrl).Host.ToLowerInvariant();

    public string ApiBaseUrl => $"{BaseUrl.TrimEnd('/')}/api/v4";
}
