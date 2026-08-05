namespace Sentinel.Domain.Abstractions;

public sealed record RepositoryListing(
    bool Success,
    int? StatusCode,
    List<(string Name, string Url)> Repos,
    bool Truncated);

public sealed record RepositoryFileListing(List<(string Name, string Url)> Files, bool Truncated);

public interface IRepositoryHostClient
{
    Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform);

    Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform);

    Task<string?> GetHeadCommitAsync(string host, string owner, string repo, string? tokenOverride = null);

    Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
        string? tokenOverride = null, string? commitSha = null);

    Task<string?> FetchTextAsync(string host, string url, string? tokenOverride = null);
}
