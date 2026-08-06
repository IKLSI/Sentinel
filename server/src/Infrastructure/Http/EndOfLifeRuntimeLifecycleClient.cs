using System.Text.Json;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Infrastructure.Http;

public class EndOfLifeRuntimeLifecycleClient(
    IHttpClientFactory httpClientFactory,
    ILogger<EndOfLifeRuntimeLifecycleClient> logger) : IRuntimeLifecycleClient
{
    private static readonly Dictionary<string, string> Products = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Node.js"] = "nodejs",
        ["Python"] = "python",
        [".NET"] = "dotnet",
        ["PHP"] = "php",
        ["Ruby"] = "ruby",
        ["Go"] = "go",
        ["Java"] = "java",
        ["Rust"] = "rust",
        ["React"] = "react",
        ["Vue"] = "vue",
        ["Angular"] = "angular",
        ["Next.js"] = "nextjs",
        ["Nuxt"] = "nuxt",
        ["Svelte"] = "svelte",
        ["Express"] = "express",
        ["Django"] = "django",
        ["Laravel"] = "laravel",
        ["Symfony"] = "symfony",
        ["Rails"] = "rails",
        ["Kotlin"] = "kotlin",
        ["Elixir"] = "elixir",
    };

    public async Task<RuntimeLifecycle?> GetLifecycleAsync(string runtimeName, string version)
    {
        if (!Products.TryGetValue(runtimeName, out string? product)) return null;

        string[] parts = version.Split('.');
        if (parts.Length == 0 || parts[0] == "unknown") return null;

        string cycle = runtimeName.ToLowerInvariant() switch
        {
            "node.js" or "nodejs" => parts[0],
            "react" or "angular" or "next.js" or "nuxt" or "svelte" or "express" or "laravel" => parts[0],
            ".net" or "dotnet" => parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : parts[0],
            _ => parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : parts[0]
        };

        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.EolDate);

            using HttpResponseMessage response =
                await client.GetAsync($"https://endoflife.date/api/{product}/{cycle}.json");

            if (!response.IsSuccessStatusCode) return null;

            using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

            if (!document.RootElement.TryGetProperty("eol", out JsonElement eol)) return null;

            if (eol.ValueKind == JsonValueKind.True) return new RuntimeLifecycle(true, null);

            if (eol.ValueKind == JsonValueKind.False) return new RuntimeLifecycle(false, null);

            if (eol.ValueKind == JsonValueKind.String && DateTime.TryParse(eol.GetString(), out DateTime eolDate))
                return new RuntimeLifecycle(null, DateTime.SpecifyKind(eolDate, DateTimeKind.Utc));

            return null;
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "EOL check unavailable for {Runtime} {Version}", runtimeName, version);
            return null;
        }
    }
}
