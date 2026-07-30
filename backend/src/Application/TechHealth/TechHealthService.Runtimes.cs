using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Hangfire;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using Sentinel.Application.Billing;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Settings;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth;

public partial class TechHealthService
{
    private static readonly Dictionary<string, string> EolProductMap = new(StringComparer.OrdinalIgnoreCase)
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

    private sealed record RuntimeEolResult(Runtime Runtime, bool? IsEol, DateTime? EolDate);

    private async Task<RuntimeEolResult?> FetchRuntimeEolAsync(Runtime runtime)
    {
        if (!EolProductMap.TryGetValue(runtime.Name, out string? product)) return null;

        string[] parts = runtime.Version.Split('.');
        if (parts.Length == 0 || parts[0] == "unknown") return null;

        string cycle = runtime.Name.ToLowerInvariant() switch
        {
            "node.js" or "nodejs" => parts[0],
            "react" or "angular" or "next.js" or "nuxt" or "svelte" or "express" or "laravel" => parts[0],
            ".net" or "dotnet" => parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : parts[0],
            _ => parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : parts[0]
        };

        try
        {
            HttpClient eolClient = _httpClientFactory.CreateClient(HttpClientNames.EolDate);
            using HttpResponseMessage response = await eolClient.GetAsync($"https://endoflife.date/api/{product}/{cycle}.json");
            if (!response.IsSuccessStatusCode) return null;

            using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty("eol", out JsonElement eolProp)) return null;

            if (eolProp.ValueKind == JsonValueKind.True)
                return new RuntimeEolResult(runtime, true, null);

            if (eolProp.ValueKind == JsonValueKind.False)
                return new RuntimeEolResult(runtime, false, null);

            if (eolProp.ValueKind == JsonValueKind.String &&
                DateTime.TryParse(eolProp.GetString(), out DateTime eolDate))
            {
                eolDate = DateTime.SpecifyKind(eolDate, DateTimeKind.Utc);
                return new RuntimeEolResult(runtime, eolDate < DateTime.UtcNow, eolDate);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "EOL check non disponible pour {Runtime} {Version}", runtime.Name, runtime.Version);
            return null;
        }
    }

}
