using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json;

namespace Sentinel.Application.Services;

public class RepositoryHostClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _githubToken;

    private static readonly HashSet<string> SkippedDirs = new(StringComparer.OrdinalIgnoreCase)
    {
        "node_modules", ".git", "vendor", "bin", "obj", ".next", "dist", "build", "__pycache__",
        "target", ".gradle", ".cargo",
    };

    public RepositoryHostClient(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _githubToken = configuration["GitHub:Token"];
    }

    public async Task<List<(string Name, string Url)>> ListFilesAsync(string host, string owner, string repo)
    {
        if (host.Contains("github"))
        {
            HttpClient client = CreateGitHubClient();
            return await ListGitHubFilesAsync(client, owner, repo);
        }
        if (host.Contains("gitlab"))
        {
            HttpClient client = _httpClientFactory.CreateClient("Registry");
            return await ListGitLabFilesAsync(client, owner, repo);
        }
        return [];
    }

    public async Task<string?> FetchTextAsync(string host, string url)
    {
        HttpClient client = host.Contains("github") ? CreateGitHubClient() : _httpClientFactory.CreateClient("Registry");
        return await FetchTextAsync(client, url);
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

    private HttpClient CreateGitHubClient()
    {
        HttpClient client = _httpClientFactory.CreateClient("Registry");
        if (!string.IsNullOrEmpty(_githubToken))
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _githubToken);
        return client;
    }

    private static async Task<List<(string Name, string Url)>> ListGitHubFilesAsync(HttpClient client, string owner, string repo)
    {
        List<(string, string)> result = new List<(string, string)>();
        JsonElement treeResponse;
        try
        {
            JsonElement resp = await client.GetFromJsonAsync<JsonElement>(
                $"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1");
            treeResponse = resp;
        }
        catch { return result; }

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
