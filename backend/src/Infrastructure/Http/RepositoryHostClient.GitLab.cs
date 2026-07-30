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
        int page = 1;

        while (true)
        {
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get,
                $"https://gitlab.com/api/v4/projects?membership=true&per_page=100&page={page}");
            request.Headers.Add("PRIVATE-TOKEN", token);

            HttpResponseMessage response;
            try { response = await client.SendAsync(request); }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Échec récupération des dépôts GitLab");
                return (false, null, result);
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Échec récupération des dépôts GitLab : statut {Status}", response.StatusCode);
                return (false, (int)response.StatusCode, result);
            }

            List<JsonElement>? projects;
            try { projects = await response.Content.ReadFromJsonAsync<List<JsonElement>>(); }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Échec lecture des dépôts GitLab");
                return (false, null, result);
            }

            if (projects == null || projects.Count == 0) break;

            foreach (JsonElement project in projects)
            {
                string name = project.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
                string url = project.TryGetProperty("http_url_to_repo", out JsonElement u) ? u.GetString() ?? "" : "";
                if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(url))
                    result.Add((name, url));
            }

            if (projects.Count < 100) break;
            page++;
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
                HttpResponseMessage response = await client.SendAsync(request);
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

    private async Task<HostWriteResult> CreateGitLabMergeRequestAsync(
        string owner, string repo, string token, string branch, string title, string body,
        IReadOnlyList<(string Path, string Content)> files)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
        string projectId = Uri.EscapeDataString($"{owner}/{repo}");
        string apiBase = $"https://gitlab.com/api/v4/projects/{projectId}";

        HostApiResponse projectInfo = await SendGitLabAsync(client, HttpMethod.Get, apiBase, token, null);
        if (projectInfo.Json is not { } info || !info.TryGetProperty("default_branch", out JsonElement defBranchProp))
            return new HostWriteResult(false, null, $"Dépôt inaccessible (GitLab {projectInfo.Status}) : {WriteHint(projectInfo.Status)}");

        string defaultBranch = defBranchProp.GetString() ?? "main";

        object[] actions = files
            .Select(f => (object)new { action = "update", file_path = f.Path, content = f.Content })
            .ToArray();

        HostApiResponse commit = await SendGitLabAsync(client, HttpMethod.Post, $"{apiBase}/repository/commits", token, new
        {
            branch,
            start_branch = defaultBranch,
            commit_message = $"chore(deps): {title}",
            actions
        });

        if (commit.Json == null)
            return new HostWriteResult(false, null, $"Impossible de créer le commit de remédiation (GitLab {commit.Status}) : {commit.Error ?? WriteHint(commit.Status)}");

        HostApiResponse mr = await SendGitLabAsync(client, HttpMethod.Post, $"{apiBase}/merge_requests", token, new
        {
            source_branch = branch,
            target_branch = defaultBranch,
            title,
            description = body
        });

        if (mr.Json is { } mrObj && mrObj.TryGetProperty("web_url", out JsonElement urlProp))
            return new HostWriteResult(true, urlProp.GetString(), null);

        return new HostWriteResult(false, null, $"La merge request n'a pas pu être ouverte (GitLab {mr.Status}) : {mr.Error ?? WriteHint(mr.Status)}");
    }

    private const int MaxRateLimitRetries = 3;
    private async Task<HostApiResponse> SendGitLabAsync(HttpClient client, HttpMethod method, string url, string token, object? payload)
    {
        return await SendAsync(client, () =>
        {
            HttpRequestMessage request = new HttpRequestMessage(method, url);
            request.Headers.Add("PRIVATE-TOKEN", token);
            if (payload != null)
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            return request;
        }, method, url, "GitLab");
    }

}
