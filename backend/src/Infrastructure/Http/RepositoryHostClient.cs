using Microsoft.Extensions.Logging;
using System.Buffers;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Infrastructure.Http;

internal readonly record struct HostApiResponse(JsonElement? Json, int Status, string? Error);

public partial class RepositoryHostClient(IHttpClientFactory httpClientFactory, ILogger<RepositoryHostClient> logger) : IRepositoryHostClient
{
    private const long MaxFileBytes = 5 * 1024 * 1024;

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
                using HttpResponseMessage response =
                    await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

                return await ReadBoundedTextAsync(response, url);
            }
            catch { return null; }
        }

        return await FetchTextAsync(client, url, host.Contains("gitlab") ? tokenOverride : null);
    }

    private async Task<string?> ReadBoundedTextAsync(HttpResponseMessage response, string url)
    {
        if (!response.IsSuccessStatusCode) return null;

        if (response.Content.Headers.ContentLength is long declaredLength && declaredLength > MaxFileBytes)
        {
            logger.LogWarning("Fichier {Url} ignoré : {Size} octets dépassent la limite de {Limit}",
                url, declaredLength, MaxFileBytes);
            return null;
        }

        await using Stream stream = await response.Content.ReadAsStreamAsync();
        using MemoryStream buffer = new MemoryStream();

        byte[] chunk = ArrayPool<byte>.Shared.Rent(81920);

        try
        {
            int read;

            while ((read = await stream.ReadAsync(chunk)) > 0)
            {
                if (buffer.Length + read > MaxFileBytes)
                {
                    logger.LogWarning("Fichier {Url} ignoré : dépasse la limite de {Limit} octets", url, MaxFileBytes);
                    return null;
                }

                buffer.Write(chunk, 0, read);
            }
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(chunk);
        }

        return Encoding.UTF8.GetString(buffer.GetBuffer(), 0, (int)buffer.Length);
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

    private async Task<string?> FetchTextAsync(HttpClient client, string url, string? gitlabToken = null)
    {
        try
        {
            using HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrEmpty(gitlabToken))
                request.Headers.Add("PRIVATE-TOKEN", gitlabToken);

            using HttpResponseMessage response =
                await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            return await ReadBoundedTextAsync(response, url);
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

}
