using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Infrastructure.Http;

public class EndOfLifeRuntimeLifecycleClient(
    IHttpClientFactory httpClientFactory,
    IMemoryCache cache,
    InFlightRequestCoalescer coalescer,
    ILogger<EndOfLifeRuntimeLifecycleClient> logger) : IRuntimeLifecycleClient
{
    public async Task<RuntimeLifecycle?> GetLifecycleAsync(string runtimeName, string version,
        CancellationToken cancellationToken)
    {
        string? product = EndOfLifeCatalog.ResolveProduct(runtimeName);
        if (product == null) return null;

        string? normalizedVersion = EndOfLifeCatalog.NormalizeVersion(runtimeName, version);
        if (normalizedVersion == null) return null;

        IReadOnlyCollection<EndOfLifeCycle> cycles = await GetCyclesAsync(product, cancellationToken);

        EndOfLifeCycle? cycle = EndOfLifeCatalog.SelectCycle(cycles, normalizedVersion);

        if (cycle == null)
        {
            logger.LogDebug("No end-of-life cycle matches {Runtime} {Version} on product {Product}",
                runtimeName, version, product);
            return null;
        }

        return new RuntimeLifecycle(cycle.IsEndOfLife, cycle.EndOfLifeDate, cycle.ReleaseDate);
    }

    private async Task<IReadOnlyCollection<EndOfLifeCycle>> GetCyclesAsync(string product,
        CancellationToken cancellationToken)
    {
        string cacheKey = CacheKeys.RuntimeLifecycle(product);

        if (cache.TryGetValue(cacheKey, out IReadOnlyCollection<EndOfLifeCycle>? cached) && cached != null)
            return cached;

        return await coalescer.RunAsync(cacheKey, () => LoadCyclesAsync(product, cacheKey), cancellationToken);
    }

    private async Task<IReadOnlyCollection<EndOfLifeCycle>> LoadCyclesAsync(string product, string cacheKey)
    {
        if (cache.TryGetValue(cacheKey, out IReadOnlyCollection<EndOfLifeCycle>? cached) && cached != null)
            return cached;

        IReadOnlyCollection<EndOfLifeCycle> cycles = await FetchCyclesAsync(product);

        cache.Set(cacheKey, cycles, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = cycles.Count == 0
                ? CacheKeys.RuntimeLifecycleUnresolvedTtl
                : CacheKeys.RuntimeLifecycleTtl,
            Size = Math.Max(1, cycles.Count)
        });

        return cycles;
    }

    private async Task<IReadOnlyCollection<EndOfLifeCycle>> FetchCyclesAsync(string product)
    {
        try
        {
            HttpClient client = httpClientFactory.CreateClient(HttpClientNames.EolDate);

            using HttpResponseMessage response =
                await client.GetAsync($"https://endoflife.date/api/{product}.json");

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("End-of-life product {Product} returned {StatusCode}",
                    product, (int)response.StatusCode);
                return [];
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync();
            using JsonDocument document = await JsonDocument.ParseAsync(stream);

            if (document.RootElement.ValueKind != JsonValueKind.Array) return [];

            List<EndOfLifeCycle> cycles = new List<EndOfLifeCycle>();

            foreach (JsonElement release in document.RootElement.EnumerateArray())
            {
                EndOfLifeCycle? cycle = ReadCycle(release);
                if (cycle != null) cycles.Add(cycle);
            }

            return cycles;
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "End-of-life data unavailable for product {Product}", product);
            return [];
        }
    }

    private static EndOfLifeCycle? ReadCycle(JsonElement release)
    {
        if (!release.TryGetProperty("cycle", out JsonElement cycleProperty)) return null;

        string? cycle = cycleProperty.ValueKind switch
        {
            JsonValueKind.String => cycleProperty.GetString(),
            JsonValueKind.Number => cycleProperty.GetRawText(),
            _ => null
        };

        if (string.IsNullOrEmpty(cycle)) return null;

        DateTime? releaseDate = ReadDate(release, "releaseDate");

        if (!release.TryGetProperty("eol", out JsonElement eol))
            return new EndOfLifeCycle(cycle, null, null, releaseDate);

        return eol.ValueKind switch
        {
            JsonValueKind.True => new EndOfLifeCycle(cycle, true, null, releaseDate),
            JsonValueKind.False => new EndOfLifeCycle(cycle, false, null, releaseDate),
            JsonValueKind.String when ParseDate(eol.GetString()) is DateTime eolDate =>
                new EndOfLifeCycle(cycle, null, eolDate, releaseDate),
            _ => new EndOfLifeCycle(cycle, null, null, releaseDate)
        };
    }

    private static DateTime? ReadDate(JsonElement release, string propertyName) =>
        release.TryGetProperty(propertyName, out JsonElement property) && property.ValueKind == JsonValueKind.String
            ? ParseDate(property.GetString())
            : null;

    private static DateTime? ParseDate(string? value) =>
        DateTime.TryParse(value, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out DateTime date)
            ? date
            : null;
}
