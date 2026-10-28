using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Git;
using Sentinel.Domain.Parsing;
using static Sentinel.Infrastructure.Http.RepositoryHosting.RepositoryHostHttp;

namespace Sentinel.Infrastructure.Http.RepositoryHosting;

internal sealed class GitHubRepositoryHost(
    IHttpClientFactory httpClientFactory,
    IOptions<RepositoryHostSettings> settings,
    IMemoryCache cache,
    RepositoryHostHttp http,
    ILogger logger)
{
    private const string ApiBaseUrl = "https://api.github.com";
    private const string ShaMediaType = "application/vnd.github.sha";
    private const int MaxComparedFiles = 300;

    public Task<RepositoryListing> ListUserRepositoriesAsync(string token, CancellationToken cancellationToken) =>
        http.ListRepositoriesAsync(CreateClient(),
            page => BuildRequest(
                $"{ApiBaseUrl}/user/repos?per_page={RepositoryPageSize}&page={page}&affiliation=owner,collaborator,organization_member",
                token),
            "html_url", "GitHub", cancellationToken);

    public async Task<(string Id, string Login)?> GetAccountAsync(string token, CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = BuildRequest($"{ApiBaseUrl}/user", token);
        try
        {
            return await ReadAccountAsync(CreateClient(), request, "login", cancellationToken);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Failed to fetch GitHub identity");
            return null;
        }
    }

    public async Task<string?> GetHeadCommitAsync(string owner, string repo, RepositoryAccess access, string? branch,
        CancellationToken cancellationToken)
    {
        string? token = await ResolveTokenAsync(owner, repo, access.Token, cancellationToken);

        try
        {
            HttpClient client = CreateClient();
            using HttpRequestMessage request = BuildRequest(
                $"{ApiBaseUrl}/repos/{owner}/{repo}/commits/{Uri.EscapeDataString(branch ?? "HEAD")}", token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue(ShaMediaType));

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

    public async Task<RepositoryBranchListing?> ListBranchesAsync(string owner, string repo, RepositoryAccess access,
        CancellationToken cancellationToken)
    {
        string? token = await ResolveTokenAsync(owner, repo, access.Token, cancellationToken);
        HttpClient client = CreateClient();
        string repositoryApiUrl = $"{ApiBaseUrl}/repos/{owner}/{repo}";

        try
        {
            string? defaultBranch;

            using (HttpRequestMessage request = BuildRequest(repositoryApiUrl, token))
            {
                (HttpStatusCode status, JsonElement repository) =
                    await TryGetJsonAsync<JsonElement>(client, request, cancellationToken);
                if (!IsSuccess(status)) return null;

                defaultBranch = repository.StringProperty("default_branch");
            }

            List<string> branches = [];

            for (int page = 1; page <= BranchPageLimit; page++)
            {
                using HttpRequestMessage request = BuildRequest(
                    $"{repositoryApiUrl}/branches?per_page={RepositoryPageSize}&page={page}", token);
                (HttpStatusCode status, List<JsonElement>? items) =
                    await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);
                if (!IsSuccess(status)) return new RepositoryBranchListing(defaultBranch, branches, true);

                if (items == null || items.Count == 0) break;

                branches.AddRange(items
                    .Select(item => item.StringProperty("name"))
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

    public async Task<List<string>?> ListTagsAsync(string owner, string repo, RepositoryAccess access,
        CancellationToken cancellationToken)
    {
        string? token = await ResolveTokenAsync(owner, repo, access.Token, cancellationToken);

        try
        {
            using HttpRequestMessage request = BuildRequest(
                $"{ApiBaseUrl}/repos/{owner}/{repo}/tags?per_page={RepositoryPageSize}", token);
            (HttpStatusCode status, List<JsonElement>? tags) =
                await TryGetJsonAsync<List<JsonElement>>(CreateClient(), request, cancellationToken);
            if (!IsSuccess(status)) return null;

            return (tags ?? []).Select(tag => tag.StringProperty("name")).OfType<string>().ToList();
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub tag listing failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    public async Task<RepositoryComparison?> CompareAsync(string owner, string repo, RepositoryAccess access,
        string baseReference, string headReference, CancellationToken cancellationToken)
    {
        string? token = await ResolveTokenAsync(owner, repo, access.Token, cancellationToken);

        try
        {
            using HttpRequestMessage request = BuildRequest(
                $"{ApiBaseUrl}/repos/{owner}/{repo}/compare/{EscapeReference(baseReference)}...{EscapeReference(headReference)}?per_page={RepositoryPageSize}",
                token);
            (HttpStatusCode status, JsonElement comparison) =
                await TryGetJsonAsync<JsonElement>(CreateClient(), request, cancellationToken);
            if (!IsSuccess(status)) return null;

            List<RepositoryCommit> commits = comparison.TryGetProperty("commits", out JsonElement commitItems)
                ? commitItems.EnumerateArray().Select(ReadCommit).ToList()
                : [];
            List<RepositoryChangedFile> files = comparison.TryGetProperty("files", out JsonElement fileItems)
                ? fileItems.EnumerateArray().Select(ReadChangedFile).OfType<RepositoryChangedFile>().ToList()
                : [];
            int totalCommits = comparison.TryGetProperty("total_commits", out JsonElement total)
                && total.TryGetInt32(out int count)
                    ? count
                    : commits.Count;

            return new RepositoryComparison(commits, files,
                totalCommits > commits.Count || files.Count >= MaxComparedFiles);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub comparison failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private static RepositoryCommit ReadCommit(JsonElement item)
    {
        JsonElement commit = item.TryGetProperty("commit", out JsonElement details) ? details : default;
        JsonElement author = commit.ValueKind == JsonValueKind.Object
            && commit.TryGetProperty("author", out JsonElement authorElement)
                ? authorElement
                : default;

        return new RepositoryCommit(
            commit.ValueKind == JsonValueKind.Object ? commit.StringProperty("message") ?? "" : "",
            author.ValueKind == JsonValueKind.Object ? ParseDate(author.StringProperty("date")) : null);
    }

    private static RepositoryChangedFile? ReadChangedFile(JsonElement item)
    {
        string? path = item.StringProperty("filename");
        if (string.IsNullOrEmpty(path)) return null;

        RepositoryFileChange change = item.StringProperty("status") switch
        {
            "added" or "copied" => RepositoryFileChange.Added,
            "removed" => RepositoryFileChange.Removed,
            "renamed" => RepositoryFileChange.Renamed,
            _ => RepositoryFileChange.Modified
        };

        return new RepositoryChangedFile(path, change);
    }

    public static string FileUrl(string owner, string repo, string reference, string path) =>
        $"https://raw.githubusercontent.com/{owner}/{repo}/{reference}/{EscapeReference(path)}";

    private static string EscapeReference(string reference) =>
        string.Join('/', reference.Split('/').Select(Uri.EscapeDataString));

    public async Task<RepositoryFileListing> ListFilesAsync(string owner, string repo, string reference,
        RepositoryAccess access, CancellationToken cancellationToken)
    {
        string? token = await ResolveTokenAsync(owner, repo, access.Token, cancellationToken);
        List<(string Name, string Url, string Path)> result = new List<(string, string, string)>();
        JsonElement treeResponse;
        try
        {
            HttpClient client = CreateClient();
            using HttpRequestMessage request = BuildRequest(
                $"{ApiBaseUrl}/repos/{owner}/{repo}/git/trees/{reference}?recursive=1", token);
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
            string path = item.StringProperty("path") ?? "";
            string type = item.StringProperty("type") ?? "";

            if (type != "blob") continue;
            if (IsInSkippedDirectory(path)) continue;

            result.Add((Path.GetFileName(path), FileUrl(owner, repo, reference, path), path));
        }

        return new RepositoryFileListing(result, isTruncated);
    }

    public async Task<string?> FetchTextAsync(string url, RepositoryAccess access, CancellationToken cancellationToken)
    {
        HttpClient client = CreateClient();
        using HttpRequestMessage request = BuildRequest(url, access.Token);
        return await http.DownloadTextAsync(client, request, url, cancellationToken);
    }

    public async Task<string?> FindPullRequestUrlAsync(string owner, string repo, string? token,
        string sourceBranch, CancellationToken cancellationToken)
    {
        try
        {
            HttpClient client = CreateClient();
            using HttpRequestMessage request = BuildRequest(
                $"{ApiBaseUrl}/repos/{owner}/{repo}/pulls?state=open&head={Uri.EscapeDataString($"{owner}:{sourceBranch}")}",
                token);
            (_, List<JsonElement>? pulls) = await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);

            return pulls is [var pull, ..] ? pull.StringProperty("html_url") : null;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub pull request lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private async Task<string?> ResolveTokenAsync(string owner, string repo, string? organizationToken,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(organizationToken)) return organizationToken;

        string serverToken = settings.Value.GitHubToken;
        if (string.IsNullOrEmpty(serverToken)) return null;

        return await IsPublicRepositoryAsync(owner, repo, serverToken, cancellationToken) ? serverToken : null;
    }

    private async Task<bool> IsPublicRepositoryAsync(string owner, string repo, string serverToken,
        CancellationToken cancellationToken)
    {
        string cacheKey = CacheKeys.GitHubPublicRepository(owner, repo);
        if (cache.TryGetValue(cacheKey, out bool cachedIsPublic)) return cachedIsPublic;

        if (await FetchVisibilityAsync(owner, repo, serverToken, cancellationToken) is not { } isPublic)
            return false;

        cache.Set(cacheKey, isPublic, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheKeys.GitHubPublicRepositoryTtl,
            Size = 1
        });

        return isPublic;
    }

    private async Task<bool?> FetchVisibilityAsync(string owner, string repo, string serverToken,
        CancellationToken cancellationToken)
    {
        try
        {
            HttpClient client = CreateClient();
            using HttpRequestMessage request = BuildRequest($"{ApiBaseUrl}/repos/{owner}/{repo}", serverToken);
            (HttpStatusCode status, JsonElement repository) =
                await TryGetJsonAsync<JsonElement>(client, request, cancellationToken);

            if (status == HttpStatusCode.NotFound) return false;
            if (!IsSuccess(status)) return null;

            return repository.TryGetProperty("private", out JsonElement isPrivate)
                && isPrivate.ValueKind == JsonValueKind.False;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub visibility lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private static HttpRequestMessage BuildRequest(string url, string? token)
    {
        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private HttpClient CreateClient() => httpClientFactory.CreateClient(HttpClientNames.Registry);
}
