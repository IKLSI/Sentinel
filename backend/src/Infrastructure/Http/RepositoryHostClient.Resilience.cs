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
    private static readonly TimeSpan MaxRateLimitDelay = TimeSpan.FromSeconds(8);

    private async Task<HostApiResponse> SendAsync(HttpClient client, Func<HttpRequestMessage> requestFactory, HttpMethod method, string url, string platform)
    {
        for (int attempt = 1; ; attempt++)
        {
            using HttpRequestMessage request = requestFactory();
            using HttpResponseMessage response = await client.SendAsync(request);
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
