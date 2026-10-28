using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Git;
using Sentinel.Domain.Parsing;
using static Sentinel.Infrastructure.Http.RepositoryHosting.RepositoryHostHttp;

namespace Sentinel.Infrastructure.Http.RepositoryHosting;

internal sealed class GitLabRepositoryHost(
    IHttpClientFactory httpClientFactory,
    RepositoryHostHttp http,
    ILogger logger)
{
    private const int TreePageSize = 100;
    private const int TreePageLimit = 500;
    private const int MaxConcurrentTreeRequests = 4;

    public Task<RepositoryListing> ListUserRepositoriesAsync(string token, GitLabInstance gitLab,
        CancellationToken cancellationToken) =>
        http.ListRepositoriesAsync(CreateClient(),
            page => BuildRequest(
                $"{gitLab.ApiBaseUrl}/projects?membership=true&per_page={RepositoryPageSize}&page={page}", token),
            "http_url_to_repo", "GitLab", cancellationToken);

    public async Task<(string Id, string Login)?> GetAccountAsync(string token, GitLabInstance gitLab,
        CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = BuildRequest($"{gitLab.ApiBaseUrl}/user", token);
        try
        {
            return await ReadAccountAsync(CreateClient(), request, "username", cancellationToken);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Failed to fetch GitLab identity from {Host}", gitLab.Host);
            return null;
        }
    }

    public async Task<string?> GetHeadCommitAsync(string owner, string repo, RepositoryAccess access,
        string? branch, CancellationToken cancellationToken)
    {
        string encodedPath = Uri.EscapeDataString($"{owner}/{repo}");

        try
        {
            HttpClient client = CreateClient();
            using HttpRequestMessage request = BuildRequest(
                $"{access.GitLab.ApiBaseUrl}/projects/{encodedPath}/repository/commits?per_page=1{BranchFilter(branch)}", access.Token);

            (_, List<JsonElement>? commits) = await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);
            if (commits == null || commits.Count == 0) return null;

            return commits[0].StringProperty("id");
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitLab head commit lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    public async Task<RepositoryBranchListing?> ListBranchesAsync(string owner, string repo,
        RepositoryAccess access, CancellationToken cancellationToken)
    {
        HttpClient client = CreateClient();
        string projectApiUrl = ProjectApiUrl(access, owner, repo);
        List<string> branches = [];
        string? defaultBranch = null;

        try
        {
            for (int page = 1; page <= BranchPageLimit; page++)
            {
                using HttpRequestMessage request = BuildRequest(
                    $"{projectApiUrl}/repository/branches?per_page={RepositoryPageSize}&page={page}", access.Token);
                (HttpStatusCode status, List<JsonElement>? items) =
                    await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);
                if (!IsSuccess(status))
                    return page == 1 ? null : new RepositoryBranchListing(defaultBranch, branches, true);

                if (items == null || items.Count == 0) break;

                foreach (JsonElement item in items)
                {
                    string? name = item.StringProperty("name");
                    if (name == null) continue;

                    branches.Add(name);
                    if (item.TryGetProperty("default", out JsonElement d) && d.ValueKind == JsonValueKind.True)
                        defaultBranch = name;
                }

                if (items.Count < RepositoryPageSize) return new RepositoryBranchListing(defaultBranch, branches, false);
            }

            return new RepositoryBranchListing(defaultBranch, branches, branches.Count >= BranchPageLimit * RepositoryPageSize);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitLab branch listing failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    public async Task<List<string>?> ListTagsAsync(string owner, string repo, RepositoryAccess access,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpRequestMessage request = BuildRequest(
                $"{ProjectApiUrl(access, owner, repo)}/repository/tags?per_page={RepositoryPageSize}",
                access.Token);
            (HttpStatusCode status, List<JsonElement>? tags) =
                await TryGetJsonAsync<List<JsonElement>>(CreateClient(), request, cancellationToken);
            if (!IsSuccess(status)) return null;

            return (tags ?? []).Select(tag => tag.StringProperty("name")).OfType<string>().ToList();
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitLab tag listing failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    public async Task<RepositoryComparison?> CompareAsync(string owner, string repo, RepositoryAccess access,
        string baseReference, string headReference, CancellationToken cancellationToken)
    {
        try
        {
            using HttpRequestMessage request = BuildRequest(
                $"{ProjectApiUrl(access, owner, repo)}/repository/compare?from={Uri.EscapeDataString(baseReference)}&to={Uri.EscapeDataString(headReference)}",
                access.Token);
            (HttpStatusCode status, JsonElement comparison) =
                await TryGetJsonAsync<JsonElement>(CreateClient(), request, cancellationToken);
            if (!IsSuccess(status)) return null;

            List<RepositoryCommit> commits = comparison.TryGetProperty("commits", out JsonElement commitItems)
                ? commitItems.EnumerateArray().Select(ReadCommit).ToList()
                : [];
            List<RepositoryChangedFile> files = comparison.TryGetProperty("diffs", out JsonElement diffItems)
                ? diffItems.EnumerateArray().Select(ReadChangedFile).OfType<RepositoryChangedFile>().ToList()
                : [];

            return new RepositoryComparison(commits, files, false);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitLab comparison failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private static RepositoryCommit ReadCommit(JsonElement item) => new(
        item.StringProperty("message") ?? item.StringProperty("title") ?? "",
        ParseDate(item.StringProperty("committed_date")));

    private static RepositoryChangedFile? ReadChangedFile(JsonElement item)
    {
        string? path = item.StringProperty("new_path") ?? item.StringProperty("old_path");
        if (string.IsNullOrEmpty(path)) return null;

        RepositoryFileChange change = IsTrue(item, "new_file") ? RepositoryFileChange.Added
            : IsTrue(item, "deleted_file") ? RepositoryFileChange.Removed
            : IsTrue(item, "renamed_file") ? RepositoryFileChange.Renamed
            : RepositoryFileChange.Modified;

        return new RepositoryChangedFile(path, change);
    }

    private static bool IsTrue(JsonElement item, string propertyName) =>
        item.TryGetProperty(propertyName, out JsonElement value) && value.ValueKind == JsonValueKind.True;

    public async Task<RepositoryFileListing> ListFilesAsync(string owner, string repo, string reference,
        RepositoryAccess access, CancellationToken cancellationToken)
    {
        HttpClient client = CreateClient();
        List<(string Name, string Url, string Path)> result = new List<(string, string, string)>();
        string projectApiUrl = ProjectApiUrl(access, owner, repo);

        TreePage? firstPage = await FetchTreePageAsync(client, projectApiUrl, reference, access, 1, cancellationToken);
        if (firstPage == null) return new RepositoryFileListing(result, false);

        List<List<JsonElement>> pages = [firstPage.Items];
        bool truncated = false;

        if (firstPage.Items.Count >= TreePageSize)
        {
            truncated = firstPage.TotalPages is int totalPages
                ? await AppendKnownTreePagesAsync(client, projectApiUrl, reference, access, totalPages, pages,
                    cancellationToken)
                : await AppendSequentialTreePagesAsync(client, projectApiUrl, reference, access, pages,
                    cancellationToken);
        }

        if (truncated)
        {
            logger.LogWarning("GitLab tree for {Owner}/{Repo} truncated after {PageLimit} pages: some manifests are not analyzed",
                owner, repo, TreePageLimit);
        }

        foreach (JsonElement item in pages.SelectMany(page => page))
        {
            string name = item.StringProperty("name") ?? "";
            string type = item.StringProperty("type") ?? "";
            string path = item.StringProperty("path") ?? name;

            if (type != "blob") continue;
            if (IsInSkippedDirectory(path)) continue;

            result.Add((name, RawFileUrl(projectApiUrl, reference, path), path));
        }

        return new RepositoryFileListing(result, truncated);
    }

    public async Task<string?> FetchTextAsync(string url, RepositoryAccess access, CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = BuildRequest(url, access.Token);
        return await http.DownloadTextAsync(CreateClient(), request, url, cancellationToken);
    }

    public async Task<string?> FindMergeRequestUrlAsync(string owner, string repo, RepositoryAccess access,
        string sourceBranch, CancellationToken cancellationToken)
    {
        string projectApiUrl = ProjectApiUrl(access, owner, repo);

        try
        {
            HttpClient client = CreateClient();
            using HttpRequestMessage request = BuildRequest(
                $"{projectApiUrl}/merge_requests?state=opened&source_branch={Uri.EscapeDataString(sourceBranch)}",
                access.Token);
            (_, List<JsonElement>? mergeRequests) =
                await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);

            return mergeRequests is [var mergeRequest, ..] ? mergeRequest.StringProperty("web_url") : null;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitLab merge request lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private static async Task<bool> AppendKnownTreePagesAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, int totalPages, List<List<JsonElement>> pages,
        CancellationToken cancellationToken)
    {
        int lastPage = Math.Min(totalPages, TreePageLimit);
        TreePage?[] fetched = new TreePage?[Math.Max(0, lastPage - 1)];

        await Parallel.ForEachAsync(Enumerable.Range(2, fetched.Length),
            new ParallelOptions
            {
                MaxDegreeOfParallelism = MaxConcurrentTreeRequests,
                CancellationToken = cancellationToken
            },
            async (page, token) => fetched[page - 2] =
                await FetchTreePageAsync(client, projectApiUrl, reference, access, page, token));

        foreach (TreePage? page in fetched)
        {
            if (page == null) return true;
            pages.Add(page.Items);
        }

        return totalPages > TreePageLimit;
    }

    private static async Task<bool> AppendSequentialTreePagesAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, List<List<JsonElement>> pages, CancellationToken cancellationToken)
    {
        for (int page = 2; page <= TreePageLimit; page++)
        {
            TreePage? fetched = await FetchTreePageAsync(client, projectApiUrl, reference, access, page,
                cancellationToken);
            if (fetched == null) return true;

            pages.Add(fetched.Items);

            if (fetched.Items.Count < TreePageSize) return false;
        }

        return true;
    }

    private static async Task<TreePage?> FetchTreePageAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, int page, CancellationToken cancellationToken)
    {
        try
        {
            using HttpRequestMessage request = BuildRequest(
                $"{projectApiUrl}/repository/tree?recursive=true&per_page={TreePageSize}&page={page}&ref={Uri.EscapeDataString(reference)}",
                access.Token);
            using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            List<JsonElement>? items = await response.Content.ReadFromJsonAsync<List<JsonElement>>(cancellationToken);
            if (items == null) return null;

            int? totalPages = response.Headers.TryGetValues("X-Total-Pages", out IEnumerable<string>? values)
                && int.TryParse(values.FirstOrDefault(), out int parsed)
                    ? parsed
                    : null;

            return new TreePage(items, totalPages);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return null;
        }
    }

    private static HttpRequestMessage BuildRequest(string url, string? token)
    {
        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(token)) request.Headers.Add("PRIVATE-TOKEN", token);
        return request;
    }

    public static string FileUrl(RepositoryAccess access, string owner, string repo, string reference, string path) =>
        RawFileUrl(ProjectApiUrl(access, owner, repo), reference, path);

    private static string RawFileUrl(string projectApiUrl, string reference, string path) =>
        $"{projectApiUrl}/repository/files/{Uri.EscapeDataString(path)}/raw?ref={Uri.EscapeDataString(reference)}";

    private static string ProjectApiUrl(RepositoryAccess access, string owner, string repo) =>
        $"{access.GitLab.ApiBaseUrl}/projects/{Uri.EscapeDataString($"{owner}/{repo}")}";

    private static string BranchFilter(string? branch) =>
        string.IsNullOrWhiteSpace(branch) ? string.Empty : $"&ref_name={Uri.EscapeDataString(branch)}";

    private HttpClient CreateClient() => httpClientFactory.CreateClient(HttpClientNames.GitLab);

    private sealed record TreePage(List<JsonElement> Items, int? TotalPages);
}
