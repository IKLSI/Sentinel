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
    private async Task<(bool Success, int? StatusCode, List<(string Name, string Url)> Repos)> ListGitLabUserRepositoriesAsync(string token)
    {
        List<(string, string)> result = new();
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);

        for (int page = 1; page <= RepositoryPageLimit; page++)
        {
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get,
                $"https://gitlab.com/api/v4/projects?membership=true&per_page={RepositoryPageSize}&page={page}");
            request.Headers.Add("PRIVATE-TOKEN", token);

            HttpResponseMessage? response = null;
            List<JsonElement>? projects;

            try
            {
                try { response = await client.SendAsync(request); }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to fetch GitLab repositories");
                    return (false, null, result);
                }

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Failed to fetch GitLab repositories: status {Status}", response.StatusCode);
                    return (false, (int)response.StatusCode, result);
                }

                try { projects = await response.Content.ReadFromJsonAsync<List<JsonElement>>(); }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to read GitLab repositories");
                    return (false, null, result);
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
                logger.LogWarning("GitLab repository listing truncated after {PageLimit} pages", RepositoryPageLimit);
            }
        }

        return (true, null, result);
    }

    private static async Task<List<(string Name, string Url)>> ListGitLabFilesAsync(HttpClient client, string owner, string repo, string? token = null)
    {
        List<(string, string)> result = new List<(string, string)>();
        string encodedPath = Uri.EscapeDataString($"{owner}/{repo}");
        int page = 1;

        while (true)
        {
            List<JsonElement>? items;
            try
            {
                using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get,
                    $"https://gitlab.com/api/v4/projects/{encodedPath}/repository/tree?recursive=true&per_page=100&page={page}");
                if (!string.IsNullOrEmpty(token))
                    request.Headers.Add("PRIVATE-TOKEN", token);
                using HttpResponseMessage response = await client.SendAsync(request);
                if (!response.IsSuccessStatusCode) break;
                items = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
            }
            catch { break; }

            if (items == null || items.Count == 0) break;

            foreach (JsonElement item in items)
            {
                string name = item.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
                string type = item.TryGetProperty("type", out JsonElement t) ? t.GetString() ?? "" : "";
                string path = item.TryGetProperty("path", out JsonElement p) ? p.GetString() ?? name : name;

                if (type != "blob") continue;
                if (IsInSkippedDirectory(path)) continue;

                string rawUrl = $"https://gitlab.com/api/v4/projects/{encodedPath}/repository/files/{Uri.EscapeDataString(path)}/raw?ref=HEAD";
                result.Add((name, rawUrl));
            }

            if (items.Count < 100) break;
            page++;
        }

        return result;
    }

}
