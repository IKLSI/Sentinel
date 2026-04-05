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

    public async Task<List<(string Name, string Url)>> ListFilesAsync(string host, string owner, string repo)
    {
        if (host.Contains("github"))
            return await ListGitHubFilesAsync(owner, repo);
        if (host.Contains("gitlab"))
            return await ListGitLabFilesAsync(_httpClientFactory.CreateClient("Registry"), owner, repo);
        return [];
    }

    public async Task<string?> FetchTextAsync(string host, string url)
    {
        if (host.Contains("github"))
        {
            HttpClient client = _httpClientFactory.CreateClient("Registry");
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get, url);
            try
            {
                HttpResponseMessage response = await client.SendAsync(request);
                return response.IsSuccessStatusCode ? await response.Content.ReadAsStringAsync() : null;
            }
            catch { return null; }
        }
        return await FetchTextAsync(_httpClientFactory.CreateClient("Registry"), url);
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

    private HttpRequestMessage BuildGitHubRequest(HttpMethod method, string url)
    {
        HttpRequestMessage request = new HttpRequestMessage(method, url);
        request.Headers.Add("User-Agent", "Sentinel-Scanner/1.0");
        if (!string.IsNullOrEmpty(_githubToken))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _githubToken);
        return request;
    }

    private async Task<List<(string Name, string Url)>> ListGitHubFilesAsync(string owner, string repo)
    {
        List<(string, string)> result = new List<(string, string)>();
        JsonElement treeResponse;
        try
        {
            HttpClient client = _httpClientFactory.CreateClient("Registry");
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get,
                $"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1");
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

    private static async Task<List<(string Name, string Url)>> ListGitLabFilesAsync(HttpClient client, string owner, string repo)
    {
        List<(string, string)> result = new List<(string, string)>();
        string encodedPath = Uri.EscapeDataString($"{owner}/{repo}");
        int page = 1;

        while (true)
        {
            List<JsonElement>? items;
            try
            {
                items = await client.GetFromJsonAsync<List<JsonElement>>(
                    $"https://gitlab.com/api/v4/projects/{encodedPath}/repository/tree?recursive=true&per_page=100&page={page}");
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

    private static async Task<string?> FetchTextAsync(HttpClient client, string url)
    {
        try
        {
            HttpResponseMessage response = await client.GetAsync(url);
            return response.IsSuccessStatusCode ? await response.Content.ReadAsStringAsync() : null;
        }
        catch { return null; }
    }
}
