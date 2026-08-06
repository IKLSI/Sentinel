using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Locales.Get;

public class LocaleGetService(
    IContentPathProvider contentPath,
    IMemoryCache cache,
    LocaleGetValidator validator) : IService
{
    public async Task<Result<JsonElement>> ExecuteAsync(string culture, CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(culture, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<JsonElement>.From(validationResult);

        string normalizedCulture = NormalizeCulture(culture);
        string cacheKey = CacheKeys.Locale(normalizedCulture);

        if (cache.TryGetValue(cacheKey, out JsonElement cached))
            return Result<JsonElement>.Success(cached);

        string baseDirectory = Path.GetFullPath(Path.Combine(contentPath.ContentRootPath, "Resources", "Locales"));
        string fullPath = Path.GetFullPath(Path.Combine(baseDirectory, $"{normalizedCulture}.json"));

        if (!fullPath.StartsWith(baseDirectory + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            return Result<JsonElement>.Error(ErrorCodes.LocaleInvalidPath);

        if (!File.Exists(fullPath))
        {
            return Result<JsonElement>.NotFound(
                ErrorCodes.LocaleNotFound,
                new Dictionary<string, string> { ["culture"] = culture });
        }

        await using FileStream stream = File.OpenRead(fullPath);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        JsonElement catalog = document.RootElement.Clone();

        cache.Set(cacheKey, catalog, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheKeys.LocaleTtl,
            Size = 1
        });

        return Result<JsonElement>.Success(catalog);
    }

    private static string NormalizeCulture(string culture)
    {
        string[] parts = culture.Split('-');

        return parts.Length == 2
            ? $"{parts[0].ToLowerInvariant()}-{parts[1].ToUpperInvariant()}"
            : parts[0].ToLowerInvariant();
    }
}
