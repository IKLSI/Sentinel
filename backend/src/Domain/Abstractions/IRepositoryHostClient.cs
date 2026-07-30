namespace Sentinel.Domain.Abstractions;

public interface IRepositoryHostClient
{
    Task<(bool Success, int? StatusCode, List<(string Name, string Url)> Repos)> ListUserRepositoriesAsync(
        string token, string platform);

    Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform);

    Task<List<(string Name, string Url)>> ListFilesAsync(string host, string owner, string repo,
        string? tokenOverride = null);

    Task<string?> FetchTextAsync(string host, string url, string? tokenOverride = null);
}
