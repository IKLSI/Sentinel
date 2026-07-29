using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Infrastructure.Http;

internal readonly record struct HostApiResponse(JsonElement? Json, int Status, string? Error);

public class RepositoryHostClient(IHttpClientFactory httpClientFactory, ILogger<RepositoryHostClient> logger) : IRepositoryHostClient
{
    private static readonly HashSet<string> SkippedDirs = new(StringComparer.OrdinalIgnoreCase)
    {
        "node_modules", ".git", "vendor", "bin", "obj", ".next", "dist", "build", "__pycache__",
        "target", ".gradle", ".cargo",
    };

    public async Task<(bool Success, int? StatusCode, List<(string Name, string Url)> Repos)> ListUserRepositoriesAsync(string token, string platform)
    {
        if (platform.Contains("github", StringComparison.OrdinalIgnoreCase))
            return await ListGitHubUserRepositoriesAsync(token);
        if (platform.Contains("gitlab", StringComparison.OrdinalIgnoreCase))
            return await ListGitLabUserRepositoriesAsync(token);
        return (true, null, []);
    }

    public async Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);

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
                logger.LogWarning(ex, "Échec récupération identité GitHub");
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
                logger.LogWarning(ex, "Échec récupération identité GitLab");
                return null;
            }
        }

        return null;
    }

    public async Task<List<(string Name, string Url)>> ListFilesAsync(string host, string owner, string repo, string? tokenOverride = null)
    {
        if (host.Contains("github"))
            return await ListGitHubFilesAsync(owner, repo, tokenOverride);
        if (host.Contains("gitlab"))
            return await ListGitLabFilesAsync(httpClientFactory.CreateClient(HttpClientNames.Registry), owner, repo, tokenOverride);
        return [];
    }

    public async Task<string?> FetchTextAsync(string host, string url, string? tokenOverride = null)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);

        if (host.Contains("github"))
        {
            using HttpRequestMessage request = BuildGitHubRequest(HttpMethod.Get, url, tokenOverride);
            try
            {
                HttpResponseMessage response = await client.SendAsync(request);
                return response.IsSuccessStatusCode ? await response.Content.ReadAsStringAsync() : null;
            }
            catch { return null; }
        }

        return await FetchTextAsync(client, url, host.Contains("gitlab") ? tokenOverride : null);
    }

    private static bool IsInSkippedDirectory(string filePath)
    {
        string[] segments = filePath.Split('/');
        for (int i = 0; i < segments.Length - 1; i++)
        {
            if (SkippedDirs.Contains(segments[i])) return true;
        }
        return false;
    }

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
                logger.LogWarning(ex, "Échec récupération des dépôts GitHub");
                return (false, null, result);
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Échec récupération des dépôts GitHub : statut {Status}", response.StatusCode);
                return (false, (int)response.StatusCode, result);
            }

            List<JsonElement>? repos;
            try { repos = await response.Content.ReadFromJsonAsync<List<JsonElement>>(); }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Échec lecture des dépôts GitHub");
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
            HttpResponseMessage response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("GitHub API {Owner}/{Repo} : {StatusCode}", owner, repo, (int)response.StatusCode);
                return result;
            }
            treeResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Erreur lors du listing GitHub {Owner}/{Repo}", owner, repo);
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

    public async Task<HostWriteResult> CreatePullRequestAsync(
        string host, string owner, string repo, string token,
        string branch, string title, string body,
        IReadOnlyList<(string Path, string Content)> files)
    {
        if (string.IsNullOrEmpty(token))
            return new HostWriteResult(false, null, "Token d'accès manquant pour l'organisation.");

        if (files.Count == 0)
            return new HostWriteResult(false, null, "Aucune modification à appliquer.");

        try
        {
            if (host.Contains("github"))
                return await CreateGitHubPullRequestAsync(owner, repo, token, branch, title, body, files);
            if (host.Contains("gitlab"))
                return await CreateGitLabMergeRequestAsync(owner, repo, token, branch, title, body, files);

            return new HostWriteResult(false, null, "Plateforme non prise en charge.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Échec ouverture de la pull request {Owner}/{Repo}", owner, repo);
            return new HostWriteResult(false, null, "Échec de l'ouverture de la pull request. Vérifiez les droits du token.");
        }
    }

    private async Task<HostWriteResult> CreateGitHubPullRequestAsync(
        string owner, string repo, string token, string branch, string title, string body,
        IReadOnlyList<(string Path, string Content)> files)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
        string apiBase = $"https://api.github.com/repos/{owner}/{repo}";

        HostApiResponse repoInfo = await SendGitHubAsync(client, HttpMethod.Get, apiBase, token, null);
        if (repoInfo.Json is not { } info || !info.TryGetProperty("default_branch", out JsonElement defBranchProp))
            return new HostWriteResult(false, null, $"Dépôt inaccessible (GitHub {repoInfo.Status}) : {WriteHint(repoInfo.Status)}");

        string defaultBranch = defBranchProp.GetString() ?? "main";

        HostApiResponse baseRef = await SendGitHubAsync(client, HttpMethod.Get, $"{apiBase}/git/ref/heads/{defaultBranch}", token, null);
        if (baseRef.Json is not { } refObj
            || !refObj.TryGetProperty("object", out JsonElement objProp)
            || !objProp.TryGetProperty("sha", out JsonElement shaProp))
            return new HostWriteResult(false, null, $"Impossible de résoudre la branche de base (GitHub {baseRef.Status}).");

        string baseSha = shaProp.GetString() ?? "";

        HostApiResponse baseCommit = await SendGitHubAsync(client, HttpMethod.Get, $"{apiBase}/git/commits/{baseSha}", token, null);
        if (baseCommit.Json is not { } commitObj
            || !commitObj.TryGetProperty("tree", out JsonElement treeObj)
            || !treeObj.TryGetProperty("sha", out JsonElement baseTreeShaProp))
            return new HostWriteResult(false, null, $"Impossible de résoudre l'arbre de base (GitHub {baseCommit.Status}).");

        string baseTreeSha = baseTreeShaProp.GetString() ?? "";

        List<object> treeEntries = new();
        foreach ((string path, string content) in files)
        {
            HostApiResponse blob = await SendGitHubAsync(client, HttpMethod.Post, $"{apiBase}/git/blobs", token, new
            {
                content = Convert.ToBase64String(Encoding.UTF8.GetBytes(content)),
                encoding = "base64"
            });

            if (blob.Json is not { } blobObj || !blobObj.TryGetProperty("sha", out JsonElement blobShaProp))
                return new HostWriteResult(false, null, $"Échec de l'envoi du fichier {path} (GitHub {blob.Status}) : {WriteHint(blob.Status)}");

            treeEntries.Add(new { path, mode = "100644", type = "blob", sha = blobShaProp.GetString() });
        }

        HostApiResponse newTree = await SendGitHubAsync(client, HttpMethod.Post, $"{apiBase}/git/trees", token,
            new { base_tree = baseTreeSha, tree = treeEntries });
        if (newTree.Json is not { } newTreeObj || !newTreeObj.TryGetProperty("sha", out JsonElement newTreeShaProp))
            return new HostWriteResult(false, null, $"Impossible de créer l'arbre de remédiation (GitHub {newTree.Status}) : {WriteHint(newTree.Status)}");

        HostApiResponse newCommit = await SendGitHubAsync(client, HttpMethod.Post, $"{apiBase}/git/commits", token, new
        {
            message = $"chore(deps): {title}",
            tree = newTreeShaProp.GetString(),
            parents = new[] { baseSha }
        });
        if (newCommit.Json is not { } newCommitObj || !newCommitObj.TryGetProperty("sha", out JsonElement newCommitShaProp))
            return new HostWriteResult(false, null, $"Impossible de créer le commit de remédiation (GitHub {newCommit.Status}) : {WriteHint(newCommit.Status)}");

        HostApiResponse created = await SendGitHubAsync(client, HttpMethod.Post, $"{apiBase}/git/refs", token,
            new { @ref = $"refs/heads/{branch}", sha = newCommitShaProp.GetString() });
        if (created.Json == null)
            return new HostWriteResult(false, null, $"Impossible de créer la branche de remédiation (GitHub {created.Status}) : {WriteHint(created.Status)}");

        HostApiResponse pr = await SendGitHubAsync(client, HttpMethod.Post, $"{apiBase}/pulls", token, new
        {
            title,
            head = branch,
            @base = defaultBranch,
            body
        });

        if (pr.Json is { } prObj && prObj.TryGetProperty("html_url", out JsonElement urlProp))
            return new HostWriteResult(true, urlProp.GetString(), null);

        return new HostWriteResult(false, null, $"La pull request n'a pas pu être ouverte (GitHub {pr.Status}) : {pr.Error ?? WriteHint(pr.Status)}");
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
    private static readonly TimeSpan MaxRateLimitDelay = TimeSpan.FromSeconds(8);

    private async Task<HostApiResponse> SendGitHubAsync(HttpClient client, HttpMethod method, string url, string token, object? payload)
    {
        return await SendAsync(client, () =>
        {
            HttpRequestMessage request = new HttpRequestMessage(method, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Accept.ParseAdd("application/vnd.github+json");
            if (payload != null)
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            return request;
        }, method, url, "GitHub");
    }

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

    private async Task<HostApiResponse> SendAsync(HttpClient client, Func<HttpRequestMessage> requestFactory, HttpMethod method, string url, string platform)
    {
        for (int attempt = 1; ; attempt++)
        {
            using HttpRequestMessage request = requestFactory();
            HttpResponseMessage response = await client.SendAsync(request);
            int status = (int)response.StatusCode;

            if (IsRateLimited(response) && attempt <= MaxRateLimitRetries)
            {
                TimeSpan delay = GetRetryDelay(response, attempt);
                logger.LogWarning("{Platform} rate-limit ({Status}) sur {Method} {Url}, nouvelle tentative {Attempt}/{Max} dans {Delay}s",
                    platform, status, method, url, attempt, MaxRateLimitRetries, delay.TotalSeconds);
                await Task.Delay(delay);
                continue;
            }

            string content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("{Platform} API {Method} {Url} : {Status} {Body}", platform, method, url, status, content);
                return new HostApiResponse(null, status, ExtractApiMessage(content));
            }

            JsonElement? json = string.IsNullOrWhiteSpace(content) ? null : JsonSerializer.Deserialize<JsonElement>(content);
            return new HostApiResponse(json, status, null);
        }
    }

    private static bool IsRateLimited(HttpResponseMessage response)
    {
        int status = (int)response.StatusCode;
        if (status == 429) return true;

        if (status == 403
            && response.Headers.TryGetValues("X-RateLimit-Remaining", out IEnumerable<string>? remaining)
            && remaining.FirstOrDefault() == "0")
            return true;

        return false;
    }

    private static TimeSpan GetRetryDelay(HttpResponseMessage response, int attempt)
    {
        if (response.Headers.RetryAfter?.Delta is { } delta && delta > TimeSpan.Zero)
            return Min(delta, MaxRateLimitDelay);

        if (response.Headers.TryGetValues("X-RateLimit-Reset", out IEnumerable<string>? reset)
            && long.TryParse(reset.FirstOrDefault(), out long epochSeconds))
        {
            TimeSpan untilReset = DateTimeOffset.FromUnixTimeSeconds(epochSeconds) - DateTimeOffset.UtcNow;
            if (untilReset > TimeSpan.Zero)
                return Min(untilReset, MaxRateLimitDelay);
        }

        return TimeSpan.FromSeconds(Math.Min(Math.Pow(2, attempt), MaxRateLimitDelay.TotalSeconds));
    }

    private static TimeSpan Min(TimeSpan a, TimeSpan b) => a < b ? a : b;

    private static string? ExtractApiMessage(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        try
        {
            JsonElement root = JsonSerializer.Deserialize<JsonElement>(content);
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("message", out JsonElement msg))
                return msg.GetString();
        }
        catch { }
        return null;
    }

    private static string WriteHint(int status) => status switch
    {
        401 => "token invalide ou expiré.",
        403 => "droits insuffisants : le token doit autoriser l'écriture (scope « repo » pour un PAT classique, ou « Contents » + « Pull requests » en lecture/écriture pour un token fine-grained).",
        404 => "dépôt introuvable ou token sans accès en écriture à ce dépôt.",
        422 => "requête refusée (branche déjà existante ou paramètre invalide).",
        _ => "vérifiez les droits d'écriture du token."
    };
}
