using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Infrastructure.Http;

public partial class RepositoryHostClient
{
    private async Task<(bool Success, int? StatusCode, List<(string Name, string Url)> Repos)> ListGitHubUserRepositoriesAsync(string token)
    {
        List<(string, string)> result = new();
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
        int page = 1;

        while (true)
        {
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get,
                $"https://api.github.com/user/repos?per_page=100&page={page}&affiliation=owner,collaborator,organization_member");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            HttpResponseMessage response;
            try { response = await client.SendAsync(request); }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to fetch GitHub repositories");
                return (false, null, result);
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Failed to fetch GitHub repositories: status {Status}", response.StatusCode);
                return (false, (int)response.StatusCode, result);
            }

            List<JsonElement>? repos;
            try { repos = await response.Content.ReadFromJsonAsync<List<JsonElement>>(); }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to read GitHub repositories");
                return (false, null, result);
            }

            if (repos == null || repos.Count == 0) break;

            foreach (JsonElement repo in repos)
            {
                string name = repo.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
                string url = repo.TryGetProperty("html_url", out JsonElement u) ? u.GetString() ?? "" : "";
                if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(url))
                    result.Add((name, url));
            }

            if (repos.Count < 100) break;
            page++;
        }

        return (true, null, result);
    }

    private static HttpRequestMessage BuildGitHubRequest(HttpMethod method, string url, string? token)
    {
        HttpRequestMessage request = new HttpRequestMessage(method, url);
        if (!string.IsNullOrEmpty(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private async Task<List<(string Name, string Url)>> ListGitHubFilesAsync(string owner, string repo, string? token = null)
    {
        List<(string, string)> result = new List<(string, string)>();
        JsonElement treeResponse;
        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1", token);
            using HttpResponseMessage response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("GitHub API {Owner}/{Repo}: {StatusCode}", owner, repo, (int)response.StatusCode);
                return result;
            }
            treeResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "GitHub file listing failed for {Owner}/{Repo}", owner, repo);
            return result;
        }

        if (!treeResponse.TryGetProperty("tree", out JsonElement tree)) return result;

        foreach (JsonElement item in tree.EnumerateArray())
        {
            string path = item.TryGetProperty("path", out JsonElement p) ? p.GetString() ?? "" : "";
            string type = item.TryGetProperty("type", out JsonElement t) ? t.GetString() ?? "" : "";

            if (type != "blob") continue;
            if (IsInSkippedDirectory(path)) continue;

            string fileName = Path.GetFileName(path);
            result.Add((fileName, $"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}"));
        }

        return result;
    }

}
