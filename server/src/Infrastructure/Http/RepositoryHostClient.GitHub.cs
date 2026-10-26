using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Infrastructure.Http;

public partial class RepositoryHostClient
{
    private const string GitHubShaMediaType = "application/vnd.github.sha";

    private Task<RepositoryListing> ListGitHubUserRepositoriesAsync(string token,
        CancellationToken cancellationToken) =>
        ListRepositoriesAsync(httpClientFactory.CreateClient(HttpClientNames.Registry),
            page => BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/user/repos?per_page={RepositoryPageSize}&page={page}&affiliation=owner,collaborator,organization_member",
                token),
            "html_url", "GitHub", cancellationToken);

    private async Task<string?> FindGitHubPullRequestUrlAsync(string owner, string repo, string? token,
        string sourceBranch, CancellationToken cancellationToken)
    {
        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/repos/{owner}/{repo}/pulls?state=open&head={Uri.EscapeDataString($"{owner}:{sourceBranch}")}",
                token);
            (_, List<JsonElement>? pulls) = await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);

            return pulls is [var pull, ..] && pull.TryGetProperty("html_url", out JsonElement url)
                ? url.GetString()
                : null;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub pull request lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private HttpRequestMessage BuildGitHubRequest(HttpMethod method, string url, string? token)
    {
        HttpRequestMessage request = new HttpRequestMessage(method, url);
        if (!string.IsNullOrEmpty(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private async Task<string?> ResolveGitHubTokenAsync(string owner, string repo, string? token,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(token)) return token;

        string serverToken = settings.Value.GitHubToken;
        if (string.IsNullOrEmpty(serverToken)) return null;

        return await IsPublicGitHubRepositoryAsync(owner, repo, serverToken, cancellationToken) ? serverToken : null;
    }

    private async Task<bool> IsPublicGitHubRepositoryAsync(string owner, string repo, string serverToken,
        CancellationToken cancellationToken)
    {
        string cacheKey = CacheKeys.GitHubPublicRepository(owner, repo);
        if (cache.TryGetValue(cacheKey, out bool cachedIsPublic)) return cachedIsPublic;

        bool isPublic;

        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/repos/{owner}/{repo}", serverToken);
            (HttpStatusCode status, JsonElement repository) =
                await TryGetJsonAsync<JsonElement>(client, request, cancellationToken);
            if (status == HttpStatusCode.NotFound)
            {
                isPublic = false;
            }
            else
            {
                if (!IsSuccess(status)) return false;

                isPublic = repository.TryGetProperty("private", out JsonElement isPrivate)
                    && isPrivate.ValueKind == JsonValueKind.False;
            }
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub visibility lookup failed for {Owner}/{Repo}", owner, repo);
            return false;
        }

        cache.Set(cacheKey, isPublic, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheKeys.GitHubPublicRepositoryTtl,
            Size = 1
        });

        return isPublic;
    }

    private async Task<string?> GetGitHubHeadCommitAsync(string owner, string repo, string? token, string? branch,
        CancellationToken cancellationToken)
    {
        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/repos/{owner}/{repo}/commits/{Uri.EscapeDataString(branch ?? "HEAD")}", token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue(GitHubShaMediaType));

            using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            string sha = (await response.Content.ReadAsStringAsync(cancellationToken)).Trim();

            return string.IsNullOrEmpty(sha) ? null : sha;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub head commit lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private async Task<RepositoryBranchListing?> ListGitHubBranchesAsync(string owner, string repo, string? token,
        CancellationToken cancellationToken)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
        string repositoryApiUrl = $"https://api.github.com/repos/{owner}/{repo}";

        try
        {
            string? defaultBranch;

            using (HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get, repositoryApiUrl, token))
            {
                (HttpStatusCode status, JsonElement repository) =
                    await TryGetJsonAsync<JsonElement>(client, request, cancellationToken);
                if (!IsSuccess(status)) return null;

                defaultBranch = repository.TryGetProperty("default_branch", out JsonElement d) ? d.GetString() : null;
            }

            List<string> branches = [];

            for (int page = 1; page <= BranchPageLimit; page++)
            {
                using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                    $"{repositoryApiUrl}/branches?per_page={RepositoryPageSize}&page={page}", token);
                (HttpStatusCode status, List<JsonElement>? items) =
                    await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);
                if (!IsSuccess(status)) return new RepositoryBranchListing(defaultBranch, branches, true);

                if (items == null || items.Count == 0) break;

                branches.AddRange(items
                    .Select(item => item.TryGetProperty("name", out JsonElement n) ? n.GetString() : null)
                    .OfType<string>());

                if (items.Count < RepositoryPageSize) return new RepositoryBranchListing(defaultBranch, branches, false);
            }

            return new RepositoryBranchListing(defaultBranch, branches, branches.Count >= BranchPageLimit * RepositoryPageSize);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub branch listing failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private async Task<RepositoryFileListing> ListGitHubFilesAsync(string owner, string repo, string reference, string? token,
        CancellationToken cancellationToken)
    {
        List<(string Name, string Url, string Path)> result = new List<(string, string, string)>();
        JsonElement treeResponse;
        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/repos/{owner}/{repo}/git/trees/{reference}?recursive=1", token);
            (HttpStatusCode status, treeResponse) = await TryGetJsonAsync<JsonElement>(client, request, cancellationToken);
            if (!IsSuccess(status))
            {
                logger.LogWarning("GitHub API {Owner}/{Repo}: {StatusCode}", owner, repo, (int)status);
                return new RepositoryFileListing(result, false);
            }
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub file listing failed for {Owner}/{Repo}", owner, repo);
            return new RepositoryFileListing(result, false);
        }

        bool isTruncated = treeResponse.TryGetProperty("truncated", out JsonElement truncated)
            && truncated.ValueKind == JsonValueKind.True;

        if (isTruncated)
        {
            logger.LogWarning("GitHub tree for {Owner}/{Repo} is truncated: some manifests are not analyzed",
                owner, repo);
        }

        if (!treeResponse.TryGetProperty("tree", out JsonElement tree))
            return new RepositoryFileListing(result, isTruncated);

        foreach (JsonElement item in tree.EnumerateArray())
        {
            string path = item.TryGetProperty("path", out JsonElement p) ? p.GetString() ?? "" : "";
            string type = item.TryGetProperty("type", out JsonElement t) ? t.GetString() ?? "" : "";

            if (type != "blob") continue;
            if (IsInSkippedDirectory(path)) continue;

            string fileName = Path.GetFileName(path);
            string encodedPath = string.Join('/', path.Split('/').Select(Uri.EscapeDataString));
            result.Add((fileName, $"https://raw.githubusercontent.com/{owner}/{repo}/{reference}/{encodedPath}", path));
        }

        return new RepositoryFileListing(result, isTruncated);
    }

}
