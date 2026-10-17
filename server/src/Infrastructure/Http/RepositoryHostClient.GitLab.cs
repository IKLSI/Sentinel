using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Git;

namespace Sentinel.Infrastructure.Http;

public partial class RepositoryHostClient
{
    private const int GitLabTreePageSize = 100;
    private const int GitLabTreePageLimit = 100;
    private const int MaxConcurrentGitLabTreeRequests = 4;

    private async Task<RepositoryListing> ListGitLabUserRepositoriesAsync(string token, GitLabInstance gitLab)
    {
        List<(string, string)> result = new();
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.GitLab);
        bool truncated = false;

        for (int page = 1; page <= RepositoryPageLimit; page++)
        {
            using HttpRequestMessage request = BuildGitLabRequest(
                $"{gitLab.ApiBaseUrl}/projects?membership=true&per_page={RepositoryPageSize}&page={page}", gitLab, token);

            HttpResponseMessage? response = null;
            List<JsonElement>? projects;

            try
            {
                try { response = await client.SendAsync(request); }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to fetch GitLab repositories");
                    return new RepositoryListing(false, null, result, false);
                }

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Failed to fetch GitLab repositories: status {Status}", response.StatusCode);
                    return new RepositoryListing(false, (int)response.StatusCode, result, false);
                }

                try { projects = await response.Content.ReadFromJsonAsync<List<JsonElement>>(); }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to read GitLab repositories");
                    return new RepositoryListing(false, null, result, false);
                }
            }
            finally
            {
                response?.Dispose();
            }

            if (projects == null || projects.Count == 0) break;

            foreach (JsonElement project in projects)
            {
                string name = project.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
                string url = project.TryGetProperty("http_url_to_repo", out JsonElement u) ? u.GetString() ?? "" : "";
                if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(url))
                    result.Add((name, url));
            }

            if (projects.Count < RepositoryPageSize) break;

            if (page == RepositoryPageLimit)
            {
                truncated = true;
                logger.LogWarning("GitLab repository listing truncated after {PageLimit} pages", RepositoryPageLimit);
            }
        }

        return new RepositoryListing(true, null, result, truncated);
    }

    private async Task<string?> GetGitLabHeadCommitAsync(string owner, string repo, RepositoryAccess access)
    {
        string encodedPath = Uri.EscapeDataString($"{owner}/{repo}");

        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.GitLab);
            using HttpRequestMessage request = BuildGitLabRequest(
                $"{access.GitLab.ApiBaseUrl}/projects/{encodedPath}/repository/commits?per_page=1", access.GitLab,
                access.Token);

            using HttpResponseMessage response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;

            List<JsonElement>? commits = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
            if (commits == null || commits.Count == 0) return null;

            return commits[0].TryGetProperty("id", out JsonElement id) ? id.GetString() : null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "GitLab head commit lookup failed for {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private async Task<RepositoryFileListing> ListGitLabFilesAsync(HttpClient client, string owner, string repo,
        string reference, RepositoryAccess access)
    {
        List<(string Name, string Url)> result = new List<(string, string)>();
        string projectApiUrl = $"{access.GitLab.ApiBaseUrl}/projects/{Uri.EscapeDataString($"{owner}/{repo}")}";

        GitLabTreePage? firstPage = await FetchGitLabTreePageAsync(client, projectApiUrl, reference, access, 1);
        if (firstPage == null) return new RepositoryFileListing(result, false);

        List<List<JsonElement>> pages = [firstPage.Items];
        bool truncated = false;

        if (firstPage.Items.Count >= GitLabTreePageSize)
        {
            truncated = firstPage.TotalPages is int totalPages
                ? await AppendKnownGitLabTreePagesAsync(client, projectApiUrl, reference, access, totalPages, pages)
                : await AppendSequentialGitLabTreePagesAsync(client, projectApiUrl, reference, access, pages);
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

            string rawUrl = $"{projectApiUrl}/repository/files/{Uri.EscapeDataString(path)}/raw?ref={reference}";
            result.Add((name, rawUrl));
        }

        return new RepositoryFileListing(result, truncated);
    }

    private static async Task<bool> AppendKnownGitLabTreePagesAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, int totalPages, List<List<JsonElement>> pages)
    {
        int lastPage = Math.Min(totalPages, GitLabTreePageLimit);
        GitLabTreePage?[] fetched = new GitLabTreePage?[Math.Max(0, lastPage - 1)];

        await Parallel.ForEachAsync(Enumerable.Range(2, fetched.Length),
            new ParallelOptions { MaxDegreeOfParallelism = MaxConcurrentGitLabTreeRequests },
            async (page, _) => fetched[page - 2] =
                await FetchGitLabTreePageAsync(client, projectApiUrl, reference, access, page));

        foreach (GitLabTreePage? page in fetched)
        {
            if (page == null) return false;
            pages.Add(page.Items);
        }

        return totalPages > GitLabTreePageLimit;
    }

    private static async Task<bool> AppendSequentialGitLabTreePagesAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, List<List<JsonElement>> pages)
    {
        for (int page = 2; page <= GitLabTreePageLimit; page++)
        {
            GitLabTreePage? fetched = await FetchGitLabTreePageAsync(client, projectApiUrl, reference, access, page);
            if (fetched == null) return false;

            pages.Add(fetched.Items);

            if (fetched.Items.Count < GitLabTreePageSize) return false;
        }

        return true;
    }

    private static async Task<GitLabTreePage?> FetchGitLabTreePageAsync(HttpClient client, string projectApiUrl,
        string reference, RepositoryAccess access, int page)
    {
        try
        {
            using HttpRequestMessage request = BuildGitLabRequest(
                $"{projectApiUrl}/repository/tree?recursive=true&per_page={GitLabTreePageSize}&page={page}&ref={reference}",
                access.GitLab, access.Token);
            using HttpResponseMessage response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;

            List<JsonElement>? items = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
            if (items == null || items.Count == 0) return null;

            int? totalPages = response.Headers.TryGetValues("X-Total-Pages", out IEnumerable<string>? values)
                && int.TryParse(values.FirstOrDefault(), out int parsed)
                    ? parsed
                    : null;

            return new GitLabTreePage(items, totalPages);
        }
        catch
        {
            return null;
        }
    }

    private sealed record GitLabTreePage(List<JsonElement> Items, int? TotalPages);
}
