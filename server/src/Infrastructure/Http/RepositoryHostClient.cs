using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Buffers;
using System.Net.Http.Headers;
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
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            try
            {
                using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode) return null;
                JsonElement payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
                string id = payload.TryGetProperty("id", out JsonElement i) ? i.GetRawText() : "";
                string login = payload.TryGetProperty("login", out JsonElement l) ? l.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(login)) return null;
                return (id, login);
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
                using HttpResponseMessage response =
                    await httpClientFactory.CreateClient(HttpClientNames.GitLab).SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode) return null;
                JsonElement payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
                string id = payload.TryGetProperty("id", out JsonElement i) ? i.GetRawText() : "";
                string login = payload.TryGetProperty("username", out JsonElement u) ? u.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(login)) return null;
                return (id, login);
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

        return Encoding.UTF8.GetString(buffer.GetBuffer(), 0, (int)buffer.Length);
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
