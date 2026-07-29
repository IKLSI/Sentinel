namespace Sentinel.Domain.Abstractions;

public record HostWriteResult(bool Success, string? Url, string? Error);

public interface IRepositoryHostClient
{
    Task<(bool Success, int? StatusCode, List<(string Name, string Url)> Repos)> ListUserRepositoriesAsync(
        string token, string platform);

    Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform);

    Task<List<(string Name, string Url)>> ListFilesAsync(string host, string owner, string repo,
        string? tokenOverride = null);

    Task<string?> FetchTextAsync(string host, string url, string? tokenOverride = null);

    Task<HostWriteResult> CreatePullRequestAsync(string host, string owner, string repo, string token,
        string branch, string title, string body, IReadOnlyList<(string Path, string Content)> files);
}
