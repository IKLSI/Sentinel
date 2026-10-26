using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Git;

namespace Sentinel.Infrastructure.Http;

public partial class RepositoryHostClient
{
    private const int GitLabTreePageSize = 100;
    private const int GitLabTreePageLimit = 500;
    private const int MaxConcurrentGitLabTreeRequests = 4;

    private Task<RepositoryListing> ListGitLabUserRepositoriesAsync(string token, GitLabInstance gitLab,
        CancellationToken cancellationToken) =>
        ListRepositoriesAsync(httpClientFactory.CreateClient(HttpClientNames.GitLab),
            page => BuildGitLabRequest(
                $"{gitLab.ApiBaseUrl}/projects?membership=true&per_page={RepositoryPageSize}&page={page}", token),
            "http_url_to_repo", "GitLab", cancellationToken);

    private async Task<string?> GetGitLabHeadCommitAsync(string owner, string repo, RepositoryAccess access,
        string? branch, CancellationToken cancellationToken)
    {
        string encodedPath = Uri.EscapeDataString($"{owner}/{repo}");

        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.GitLab);
            using HttpRequestMessage request = BuildGitLabRequest(
                $"{access.GitLab.ApiBaseUrl}/projects/{encodedPath}/repository/commits?per_page=1{BranchFilter(branch)}", access.Token);

            (_, List<JsonElement>? commits) = await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);
            if (commits == null || commits.Count == 0) return null;

            return commits[0].TryGetProperty("id", out JsonElement id) ? id.GetString() : null;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitLab head commit lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private async Task<string?> FindGitLabMergeRequestUrlAsync(string owner, string repo, RepositoryAccess access,
        string sourceBranch, CancellationToken cancellationToken)
    {
        string projectApiUrl = $"{access.GitLab.ApiBaseUrl}/projects/{Uri.EscapeDataString($"{owner}/{repo}")}";

        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.GitLab);
            using HttpRequestMessage request = BuildGitLabRequest(
                $"{projectApiUrl}/merge_requests?state=opened&source_branch={Uri.EscapeDataString(sourceBranch)}",
                access.Token);
            (_, List<JsonElement>? mergeRequests) =
                await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);

            return mergeRequests is [var mergeRequest, ..] && mergeRequest.TryGetProperty("web_url", out JsonElement url)
                ? url.GetString()
                : null;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitLab merge request lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private async Task<RepositoryBranchListing?> ListGitLabBranchesAsync(string owner, string repo,
        RepositoryAccess access, CancellationToken cancellationToken)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.GitLab);
        string projectApiUrl = $"{access.GitLab.ApiBaseUrl}/projects/{Uri.EscapeDataString($"{owner}/{repo}")}";
        List<string> branches = [];
        string? defaultBranch = null;

        try
        {
            for (int page = 1; page <= BranchPageLimit; page++)
            {
                using HttpRequestMessage request = BuildGitLabRequest(
                    $"{projectApiUrl}/repository/branches?per_page={RepositoryPageSize}&page={page}", access.Token);
                (HttpStatusCode status, List<JsonElement>? items) =
                    await TryGetJsonAsync<List<JsonElement>>(client, request, cancellationToken);
                if (!IsSuccess(status))
                    return page == 1 ? null : new RepositoryBranchListing(defaultBranch, branches, true);

                if (items == null || items.Count == 0) break;

                foreach (JsonElement item in items)
                {
                    string? name = item.TryGetProperty("name", out JsonElement n) ? n.GetString() : null;
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

    private async Task<RepositoryFileListing> ListGitLabFilesAsync(HttpClient client, string owner, string repo,
        string reference, RepositoryAccess access, CancellationToken cancellationToken)
    {
        List<(string Name, string Url, string Path)> result = new List<(string, string, string)>();
        string projectApiUrl = $"{access.GitLab.ApiBaseUrl}/projects/{Uri.EscapeDataString($"{owner}/{repo}")}";

        GitLabTreePage? firstPage = await FetchGitLabTreePageAsync(client, projectApiUrl, reference, access, 1,
            cancellationToken);
        if (firstPage == null) return new RepositoryFileListing(result, false);

        List<List<JsonElement>> pages = [firstPage.Items];
        bool truncated = false;

        if (firstPage.Items.Count >= GitLabTreePageSize)
        {
            truncated = firstPage.TotalPages is int totalPages
                ? await AppendKnownGitLabTreePagesAsync(client, projectApiUrl, reference, access, totalPages, pages,
                    cancellationToken)
                : await AppendSequentialGitLabTreePagesAsync(client, projectApiUrl, reference, access, pages,
                    cancellationToken);
        }

        if (truncated)
        {
            logger.LogWarning("GitLab tree for {Owner}/{Repo} truncated after {PageLimit} pages: some manifests are not analyzed",
                owner, repo, GitLabTreePageLimit);
        }

        foreach (JsonElement item in pages.SelectMany(page => page))
        {
            string name = item.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
            string type = item.TryGetProperty("type", out JsonElement t) ? t.GetString() ?? "" : "";
            string path = item.TryGetProperty("path", out JsonElement p) ? p.GetString() ?? name : name;

            if (type != "blob") continue;
            if (IsInSkippedDirectory(path)) continue;

            string rawUrl = $"{projectApiUrl}/repository/files/{Uri.EscapeDataString(path)}/raw?ref={Uri.EscapeDataString(reference)}";
            result.Add((name, rawUrl, path));
        }

        return new RepositoryFileListing(result, truncated);
    }

    private static string BranchFilter(string? branch) =>
        string.IsNullOrWhiteSpace(branch) ? string.Empty : $"&ref_name={Uri.EscapeDataString(branch)}";

    private static async Task<bool> AppendKnownGitLabTreePagesAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, int totalPages, List<List<JsonElement>> pages,
        CancellationToken cancellationToken)
    {
        int lastPage = Math.Min(totalPages, GitLabTreePageLimit);
        GitLabTreePage?[] fetched = new GitLabTreePage?[Math.Max(0, lastPage - 1)];

        await Parallel.ForEachAsync(Enumerable.Range(2, fetched.Length),
            new ParallelOptions
            {
                MaxDegreeOfParallelism = MaxConcurrentGitLabTreeRequests,
                CancellationToken = cancellationToken
            },
            async (page, token) => fetched[page - 2] =
                await FetchGitLabTreePageAsync(client, projectApiUrl, reference, access, page, token));

        foreach (GitLabTreePage? page in fetched)
        {
            if (page == null) return true;
            pages.Add(page.Items);
        }

        return totalPages > GitLabTreePageLimit;
    }

    private static async Task<bool> AppendSequentialGitLabTreePagesAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, List<List<JsonElement>> pages, CancellationToken cancellationToken)
    {
        for (int page = 2; page <= GitLabTreePageLimit; page++)
        {
            GitLabTreePage? fetched = await FetchGitLabTreePageAsync(client, projectApiUrl, reference, access, page,
                cancellationToken);
            if (fetched == null) return true;

            pages.Add(fetched.Items);

            if (fetched.Items.Count < GitLabTreePageSize) return false;
        }

        return true;
    }

    private static async Task<GitLabTreePage?> FetchGitLabTreePageAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, int page, CancellationToken cancellationToken)
    {
        try
        {
            using HttpRequestMessage request = BuildGitLabRequest(
                $"{projectApiUrl}/repository/tree?recursive=true&per_page={GitLabTreePageSize}&page={page}&ref={Uri.EscapeDataString(reference)}",
                access.Token);
            using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            List<JsonElement>? items = await response.Content.ReadFromJsonAsync<List<JsonElement>>(cancellationToken);
            if (items == null) return null;

            int? totalPages = response.Headers.TryGetValues("X-Total-Pages", out IEnumerable<string>? values)
                && int.TryParse(values.FirstOrDefault(), out int parsed)
                    ? parsed
                    : null;

            return new GitLabTreePage(items, totalPages);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return null;
        }
    }

    private sealed record GitLabTreePage(List<JsonElement> Items, int? TotalPages);
}
