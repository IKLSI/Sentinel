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

}
