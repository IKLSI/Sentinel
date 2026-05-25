using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Sentinel.Application.Services;

public class RepositoryHostClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _githubToken;
    private readonly ILogger<RepositoryHostClient> _logger;

    private static readonly HashSet<string> SkippedDirs = new(StringComparer.OrdinalIgnoreCase)
    {
        "node_modules", ".git", "vendor", "bin", "obj", ".next", "dist", "build", "__pycache__",
        "target", ".gradle", ".cargo",
    };

    public RepositoryHostClient(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<RepositoryHostClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _githubToken = configuration["GitHub:Token"];
        _logger = logger;
    }

    public async Task<(bool Success, List<(string Name, string Url)> Repos)> ListUserRepositoriesAsync(string token, string platform)
    {
        if (platform.Contains("github", StringComparison.OrdinalIgnoreCase))
            return await ListGitHubUserRepositoriesAsync(token);
        if (platform.Contains("gitlab", StringComparison.OrdinalIgnoreCase))
            return await ListGitLabUserRepositoriesAsync(token);
        return (true, []);
    }

    public async Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform)
    {
        HttpClient client = _httpClientFactory.CreateClient("Registry");

        if (platform.Contains("github", StringComparison.OrdinalIgnoreCase))
        {
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            try
            {
                HttpResponseMessage response = await client.SendAsync(request);
                if (!response.IsSuccessStatusCode) return null;
                JsonElement payload = await response.Content.ReadFromJsonAsync<JsonElement>();
                string id = payload.TryGetProperty("id", out JsonElement i) ? i.GetRawText() : "";
                string login = payload.TryGetProperty("login", out JsonElement l) ? l.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(login)) return null;
                return (id, login);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Échec récupération identité GitHub");
                return null;
            }
        }

        if (platform.Contains("gitlab", StringComparison.OrdinalIgnoreCase))
        {
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, "https://gitlab.com/api/v4/user");
            request.Headers.Add("PRIVATE-TOKEN", token);
            try
            {
                HttpResponseMessage response = await client.SendAsync(request);
                if (!response.IsSuccessStatusCode) return null;
                JsonElement payload = await response.Content.ReadFromJsonAsync<JsonElement>();
                string id = payload.TryGetProperty("id", out JsonElement i) ? i.GetRawText() : "";
                string login = payload.TryGetProperty("username", out JsonElement u) ? u.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(login)) return null;
                return (id, login);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Échec récupération identité GitLab");
                return null;
            }
        }

        return null;
    }

    public async Task<List<(string Name, string Url)>> ListFilesAsync(string host, string owner, string repo, string? tokenOverride = null)
    {
        if (host.Contains("github"))
            return await ListGitHubFilesAsync(owner, repo, tokenOverride ?? _githubToken);
        if (host.Contains("gitlab"))
            return await ListGitLabFilesAsync(_httpClientFactory.CreateClient("Registry"), owner, repo, tokenOverride);
        return [];
    }

    public async Task<string?> FetchTextAsync(string host, string url, string? tokenOverride = null)
    {
        HttpClient client = _httpClientFactory.CreateClient("Registry");

        if (host.Contains("github"))
        {
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get, url, tokenOverride ?? _githubToken);
            try
            {
                HttpResponseMessage response = await client.SendAsync(request);
                return response.IsSuccessStatusCode ? await response.Content.ReadAsStringAsync() : null;
            }
            catch { return null; }
        }

        return await FetchTextAsync(client, url, host.Contains("gitlab") ? tokenOverride : null);
    }

    public static bool IsInSkippedDirectory(string filePath)
    {
        string[] segments = filePath.Split('/');
        for (int i = 0; i < segments.Length - 1; i++)
        {
            if (SkippedDirs.Contains(segments[i])) return true;
        }
        return false;
    }

    private async Task<(bool Success, List<(string Name, string Url)> Repos)> ListGitHubUserRepositoriesAsync(string token)
    {
        List<(string, string)> result = new();
        HttpClient client = _httpClientFactory.CreateClient("Registry");
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
                _logger.LogWarning(ex, "Échec récupération des dépôts GitHub");
                return (false, result);
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Échec récupération des dépôts GitHub : statut {Status}", response.StatusCode);
                return (false, result);
            }

            List<JsonElement>? repos;
            try { repos = await response.Content.ReadFromJsonAsync<List<JsonElement>>(); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Échec lecture des dépôts GitHub");
                return (false, result);
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

        return (true, result);
    }

    private async Task<(bool Success, List<(string Name, string Url)> Repos)> ListGitLabUserRepositoriesAsync(string token)
    {
        List<(string, string)> result = new();
        HttpClient client = _httpClientFactory.CreateClient("Registry");
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
                _logger.LogWarning(ex, "Échec récupération des dépôts GitLab");
                return (false, result);
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Échec récupération des dépôts GitLab : statut {Status}", response.StatusCode);
                return (false, result);
            }

            List<JsonElement>? projects;
            try { projects = await response.Content.ReadFromJsonAsync<List<JsonElement>>(); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Échec lecture des dépôts GitLab");
                return (false, result);
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

        return (true, result);
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
            HttpClient client = _httpClientFactory.CreateClient("Registry");
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1", token);
            HttpResponseMessage response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("GitHub API {Owner}/{Repo} : {StatusCode}", owner, repo, (int)response.StatusCode);
                return result;
            }
            treeResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors du listing GitHub {Owner}/{Repo}", owner, repo);
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

    private static async Task<string?> FetchTextAsync(HttpClient client, string url, string? gitlabToken = null)
    {
        try
        {
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrEmpty(gitlabToken))
                request.Headers.Add("PRIVATE-TOKEN", gitlabToken);
            HttpResponseMessage response = await client.SendAsync(request);
            return response.IsSuccessStatusCode ? await response.Content.ReadAsStringAsync() : null;
        }
        catch { return null; }
    }
}
