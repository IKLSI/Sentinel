using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Buffers;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Git;

namespace Sentinel.Infrastructure.Http;

public partial class RepositoryHostClient(
    IHttpClientFactory httpClientFactory,
    IOptions<RepositoryHostSettings> settings,
    IMemoryCache cache,
    ILogger<RepositoryHostClient> logger) : IRepositoryHostClient
{
    private const long MaxFileBytes = 5 * 1024 * 1024;
    private static readonly TimeSpan MaxFileDownloadDuration = TimeSpan.FromSeconds(60);
    private const int RepositoryPageSize = 100;
    private const int RepositoryPageLimit = 20;
    private const int BranchPageLimit = 10;

    private static readonly HashSet<string> SkippedDirs = new(StringComparer.OrdinalIgnoreCase)
    {
        "node_modules", ".git", "vendor", "bin", "obj", ".next", "dist", "build", "__pycache__",
        "target", ".gradle", ".cargo",
    };

    public async Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform,
        GitLabInstance gitLab, CancellationToken cancellationToken)
    {
        if (platform.Contains("github", StringComparison.OrdinalIgnoreCase))
            return await ListGitHubUserRepositoriesAsync(token, cancellationToken);
        if (platform.Contains("gitlab", StringComparison.OrdinalIgnoreCase))
            return await ListGitLabUserRepositoriesAsync(token, gitLab, cancellationToken);
        return new RepositoryListing(true, null, [], false);
    }

    public async Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform,
        GitLabInstance gitLab, CancellationToken cancellationToken)
    {
        if (platform.Contains("github", StringComparison.OrdinalIgnoreCase))
        {
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get, "https://api.github.com/user", token);
            try
            {
                return await ReadAccountAsync(httpClientFactory.CreateClient(HttpClientNames.Registry), request,
                    "login", cancellationToken);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Failed to fetch GitHub identity");
                return null;
            }
        }

        if (platform.Contains("gitlab", StringComparison.OrdinalIgnoreCase))
        {
            using HttpRequestMessage request = BuildGitLabRequest($"{gitLab.ApiBaseUrl}/user", token);
            try
            {
                return await ReadAccountAsync(httpClientFactory.CreateClient(HttpClientNames.GitLab), request,
                    "username", cancellationToken);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Failed to fetch GitLab identity from {Host}", gitLab.Host);
                return null;
            }
        }

        return null;
    }

    public async Task<string?> GetHeadCommitAsync(string host, string owner, string repo,
        RepositoryAccess? access, string? branch, CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await GetGitHubHeadCommitAsync(owner, repo,
                await ResolveGitHubTokenAsync(owner, repo, effectiveAccess.Token, cancellationToken), branch,
                cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await GetGitLabHeadCommitAsync(owner, repo, effectiveAccess, branch, cancellationToken);
        return null;
    }

    public async Task<RepositoryBranchListing?> ListBranchesAsync(string host, string owner, string repo,
        RepositoryAccess? access, CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await ListGitHubBranchesAsync(owner, repo,
                await ResolveGitHubTokenAsync(owner, repo, effectiveAccess.Token, cancellationToken),
                cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await ListGitLabBranchesAsync(owner, repo, effectiveAccess, cancellationToken);
        return null;
    }

    public async Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
        RepositoryAccess? access, string? commitSha, CancellationToken cancellationToken)
    {
        string reference = string.IsNullOrEmpty(commitSha) ? "HEAD" : commitSha;
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await ListGitHubFilesAsync(owner, repo, reference,
                await ResolveGitHubTokenAsync(owner, repo, effectiveAccess.Token, cancellationToken),
                cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await ListGitLabFilesAsync(httpClientFactory.CreateClient(HttpClientNames.GitLab), owner, repo,
                reference, effectiveAccess, cancellationToken);
        return new RepositoryFileListing([], false);
    }

    public async Task<string?> FetchTextAsync(string host, string url, RepositoryAccess? access,
        CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get, url, effectiveAccess.Token);
            return await SendBoundedAsync(client, request, url, cancellationToken);
        }

        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
        {
            using HttpRequestMessage request = BuildGitLabRequest(url, effectiveAccess.Token);
            return await SendBoundedAsync(httpClientFactory.CreateClient(HttpClientNames.GitLab), request, url,
                cancellationToken);
        }

        return null;
    }

    public async Task<string?> FindMergeRequestUrlAsync(string host, string owner, string repo,
        RepositoryAccess access, string sourceBranch, CancellationToken cancellationToken)
    {
        if (RepositoryHosts.IsGitHub(host))
            return await FindGitHubPullRequestUrlAsync(owner, repo, access.Token, sourceBranch, cancellationToken);
        if (RepositoryHosts.IsGitLab(host, access.GitLab.Host))
            return await FindGitLabMergeRequestUrlAsync(owner, repo, access, sourceBranch, cancellationToken);
        return null;
    }

    private static async Task<(string Id, string Login)?> ReadAccountAsync(HttpClient client,
        HttpRequestMessage request, string loginProperty, CancellationToken cancellationToken)
    {
        (HttpStatusCode status, JsonElement payload) =
            await TryGetJsonAsync<JsonElement>(client, request, cancellationToken);
        if (!IsSuccess(status)) return null;

        string id = payload.TryGetProperty("id", out JsonElement i) ? i.GetRawText() : "";
        string login = payload.TryGetProperty(loginProperty, out JsonElement l) ? l.GetString() ?? "" : "";
        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(login)) return null;
        return (id, login);
    }

    private async Task<RepositoryListing> ListRepositoriesAsync(HttpClient client,
        Func<int, HttpRequestMessage> pageRequest, string urlProperty, string hostLabel,
        CancellationToken cancellationToken)
    {
        List<(string, string)> result = new();
        bool truncated = false;

        for (int page = 1; page <= RepositoryPageLimit; page++)
        {
            using HttpRequestMessage request = pageRequest(page);

            HttpResponseMessage? response = null;
            List<JsonElement>? repositories;

            try
            {
                try { response = await client.SendAsync(request, cancellationToken); }
                catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
                {
                    logger.LogWarning(ex, "Failed to fetch {Host:l} repositories", hostLabel);
                    return new RepositoryListing(false, null, result, false);
                }

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Failed to fetch {Host:l} repositories: status {Status}", hostLabel,
                        response.StatusCode);
                    return new RepositoryListing(false, (int)response.StatusCode, result, false);
                }

                try { repositories = await response.Content.ReadFromJsonAsync<List<JsonElement>>(cancellationToken); }
                catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
                {
                    logger.LogWarning(ex, "Failed to read {Host:l} repositories", hostLabel);
                    return new RepositoryListing(false, null, result, false);
                }
            }
            finally
            {
                response?.Dispose();
            }

            if (repositories == null || repositories.Count == 0) break;

            foreach (JsonElement repository in repositories)
            {
                string name = repository.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
                string url = repository.TryGetProperty(urlProperty, out JsonElement u) ? u.GetString() ?? "" : "";
                if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(url))
                    result.Add((name, url));
            }

            if (repositories.Count < RepositoryPageSize) break;

            if (page == RepositoryPageLimit)
            {
                truncated = true;
                logger.LogWarning("{Host:l} repository listing truncated after {PageLimit} pages", hostLabel,
                    RepositoryPageLimit);
            }
        }

        return new RepositoryListing(true, null, result, truncated);
    }

    private static async Task<(HttpStatusCode Status, T? Body)> TryGetJsonAsync<T>(HttpClient client,
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return (response.StatusCode, default);

        return (response.StatusCode, await response.Content.ReadFromJsonAsync<T>(cancellationToken));
    }

    private static bool IsSuccess(HttpStatusCode status) => (int)status is >= 200 and <= 299;

    private static HttpRequestMessage BuildGitLabRequest(string url, string? token)
    {
        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(token)) request.Headers.Add("PRIVATE-TOKEN", token);
        return request;
    }

    private async Task<string?> SendBoundedAsync(HttpClient client, HttpRequestMessage request, string url,
        CancellationToken cancellationToken)
    {
        try
        {
            using CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(MaxFileDownloadDuration);

            using HttpResponseMessage response =
                await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);

            return await ReadBoundedTextAsync(response, url, timeout.Token);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested) { return null; }
    }

    private async Task<string?> ReadBoundedTextAsync(HttpResponseMessage response, string url,
        CancellationToken cancellationToken)
    {
        if (!response.IsSuccessStatusCode) return null;

        if (response.Content.Headers.ContentLength is long declaredLength && declaredLength > MaxFileBytes)
        {
            logger.LogWarning("File {Url} skipped: {Size} bytes exceed the {Limit} bytes limit",
                url, declaredLength, MaxFileBytes);
            return null;
        }

        await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using MemoryStream buffer = new MemoryStream();

        byte[] chunk = ArrayPool<byte>.Shared.Rent(81920);

        try
        {
            int read;

            while ((read = await stream.ReadAsync(chunk, cancellationToken)) > 0)
            {
                if (buffer.Length + read > MaxFileBytes)
                {
                    logger.LogWarning("File {Url} skipped: exceeds the {Limit} bytes limit", url, MaxFileBytes);
                    return null;
                }

                buffer.Write(chunk, 0, read);
            }
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(chunk);
        }

        ReadOnlySpan<byte> bytes = buffer.GetBuffer().AsSpan(0, (int)buffer.Length);

        if (bytes.StartsWith(Encoding.UTF8.Preamble)) bytes = bytes[Encoding.UTF8.Preamble.Length..];

        return Encoding.UTF8.GetString(bytes);
    }

    private static bool IsInSkippedDirectory(string filePath)
    {
        string[] segments = filePath.Split('/');
        for (int i = 0; i < segments.Length - 1; i++)
        {
            if (SkippedDirs.Contains(segments[i])) return true;
        }
        return false;
    }
}
