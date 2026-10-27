using System.Buffers;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Parsing;

namespace Sentinel.Infrastructure.Http.RepositoryHosting;

internal sealed class RepositoryHostHttp(ILogger logger)
{
    public const int RepositoryPageSize = 100;
    public const int RepositoryPageLimit = 20;
    public const int BranchPageLimit = 10;

    private const long MaxFileBytes = 5 * 1024 * 1024;
    private static readonly TimeSpan MaxFileDownloadDuration = TimeSpan.FromSeconds(60);

    private static readonly HashSet<string> SkippedDirs = new(StringComparer.OrdinalIgnoreCase)
    {
        "node_modules", ".git", "vendor", "bin", "obj", ".next", "dist", "build", "__pycache__",
        "target", ".gradle", ".cargo",
    };

    public static async Task<(HttpStatusCode Status, T? Body)> TryGetJsonAsync<T>(HttpClient client,
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return (response.StatusCode, default);

        return (response.StatusCode, await response.Content.ReadFromJsonAsync<T>(cancellationToken));
    }

    public static bool IsSuccess(HttpStatusCode status) => (int)status is >= 200 and <= 299;

    public static bool IsInSkippedDirectory(string filePath)
    {
        string[] segments = filePath.Split('/');
        for (int i = 0; i < segments.Length - 1; i++)
        {
            if (SkippedDirs.Contains(segments[i])) return true;
        }
        return false;
    }

    public static async Task<(string Id, string Login)?> ReadAccountAsync(HttpClient client,
        HttpRequestMessage request, string loginProperty, CancellationToken cancellationToken)
    {
        (HttpStatusCode status, JsonElement payload) =
            await TryGetJsonAsync<JsonElement>(client, request, cancellationToken);
        if (!IsSuccess(status)) return null;

        string id = payload.TryGetProperty("id", out JsonElement idProperty) ? idProperty.GetRawText() : "";
        string login = payload.TryGetProperty(loginProperty, out JsonElement loginValue)
            ? loginValue.GetString() ?? ""
            : "";
        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(login)) return null;
        return (id, login);
    }

    public async Task<RepositoryListing> ListRepositoriesAsync(HttpClient client,
        Func<int, HttpRequestMessage> pageRequest, string urlProperty, string hostLabel,
        CancellationToken cancellationToken)
    {
        List<(string, string)> result = new();
        bool truncated = false;

        for (int page = 1; page <= RepositoryPageLimit; page++)
        {
            using HttpRequestMessage request = pageRequest(page);

            RepositoryPage fetched = await FetchRepositoryPageAsync(client, request, hostLabel, cancellationToken);
            if (fetched.Failed) return new RepositoryListing(false, fetched.FailureStatus, result, false);

            List<JsonElement>? repositories = fetched.Repositories;
            if (repositories == null || repositories.Count == 0) break;

            result.AddRange(ReadNamedUrls(repositories, urlProperty));

            if (repositories.Count < RepositoryPageSize) break;

            if (page == RepositoryPageLimit)
            {
                truncated = true;
                logger.LogWarning("{Host:l} repository listing truncated after {PageLimit} pages", hostLabel,
                    RepositoryPageLimit);
            }
        }

        return new RepositoryListing(true, null, result, truncated);
    }

    public async Task<string?> DownloadTextAsync(HttpClient client, HttpRequestMessage request, string url,
        CancellationToken cancellationToken)
    {
        try
        {
            using CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(MaxFileDownloadDuration);

            using HttpResponseMessage response =
                await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);

            return await ReadBoundedTextAsync(response, url, timeout.Token);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested) { return null; }
    }

    private async Task<RepositoryPage> FetchRepositoryPageAsync(HttpClient client, HttpRequestMessage request,
        string hostLabel, CancellationToken cancellationToken)
    {
        HttpResponseMessage response;

        try { response = await client.SendAsync(request, cancellationToken); }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Failed to fetch {Host:l} repositories", hostLabel);
            return RepositoryPage.Failure(null);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Failed to fetch {Host:l} repositories: status {Status}", hostLabel,
                    response.StatusCode);
                return RepositoryPage.Failure((int)response.StatusCode);
            }

            try
            {
                return RepositoryPage.Success(
                    await response.Content.ReadFromJsonAsync<List<JsonElement>>(cancellationToken));
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Failed to read {Host:l} repositories", hostLabel);
                return RepositoryPage.Failure(null);
            }
        }
    }

    private static IEnumerable<(string Name, string Url)> ReadNamedUrls(List<JsonElement> repositories,
        string urlProperty)
    {
        foreach (JsonElement repository in repositories)
        {
            string name = repository.StringProperty("name") ?? "";
            string url = repository.TryGetProperty(urlProperty, out JsonElement urlValue) ? urlValue.GetString() ?? "" : "";
            if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(url))
                yield return (name, url);
        }
    }

    private async Task<string?> ReadBoundedTextAsync(HttpResponseMessage response, string url,
        CancellationToken cancellationToken)
    {
        if (!response.IsSuccessStatusCode) return null;

        if (response.Content.Headers.ContentLength is long declaredLength && declaredLength > MaxFileBytes)
        {
            logger.LogWarning("File {Url} skipped: {Size} bytes exceed the {Limit} bytes limit",
                url, declaredLength, MaxFileBytes);
            return null;
        }

        await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using MemoryStream buffer = new MemoryStream();

        if (!await CopyWithinLimitAsync(stream, buffer, cancellationToken))
        {
            logger.LogWarning("File {Url} skipped: exceeds the {Limit} bytes limit", url, MaxFileBytes);
            return null;
        }

        return DecodeUtf8WithoutBom(buffer);
    }

    private static async Task<bool> CopyWithinLimitAsync(Stream source, MemoryStream destination,
        CancellationToken cancellationToken)
    {
        byte[] chunk = ArrayPool<byte>.Shared.Rent(81920);

        try
        {
            int read;

            while ((read = await source.ReadAsync(chunk, cancellationToken)) > 0)
            {
                if (destination.Length + read > MaxFileBytes) return false;

                destination.Write(chunk, 0, read);
            }

            return true;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(chunk);
        }
    }

    private static string DecodeUtf8WithoutBom(MemoryStream buffer)
    {
        ReadOnlySpan<byte> bytes = buffer.GetBuffer().AsSpan(0, (int)buffer.Length);

        if (bytes.StartsWith(Encoding.UTF8.Preamble)) bytes = bytes[Encoding.UTF8.Preamble.Length..];

        return Encoding.UTF8.GetString(bytes);
    }

    private sealed record RepositoryPage(List<JsonElement>? Repositories, bool Failed, int? FailureStatus)
    {
        public static RepositoryPage Success(List<JsonElement>? repositories) => new(repositories, false, null);

        public static RepositoryPage Failure(int? status) => new(null, true, status);
    }
}
