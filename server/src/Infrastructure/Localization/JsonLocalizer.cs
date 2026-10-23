using System.Collections.Concurrent;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Localization;

public sealed class JsonLocalizer(IContentPathProvider contentPath) : ILocalizer
{
    private readonly ConcurrentDictionary<string, IReadOnlyDictionary<string, string>> _catalogs = new();

    public string Get(string culture, string key) => Resolve(culture, key);

    public string Get(string culture, string key, IReadOnlyDictionary<string, string> parameters)
    {
        string template = Resolve(culture, key);

        foreach ((string name, string value) in parameters)
            template = template.Replace($"{{{name}}}", value, StringComparison.Ordinal);

        return template;
    }

    private string Resolve(string culture, string key)
    {
        string normalized = LanguageValues.All.Contains(culture) ? culture : LanguageValues.Fr;

        if (LoadCatalog(normalized).TryGetValue(key, out string? translation))
            return translation;

        if (normalized != LanguageValues.Fr && LoadCatalog(LanguageValues.Fr).TryGetValue(key, out string? fallback))
            return fallback;

        return key;
    }

    private IReadOnlyDictionary<string, string> LoadCatalog(string culture) =>
        _catalogs.GetOrAdd(culture, ReadCatalog);

    private IReadOnlyDictionary<string, string> ReadCatalog(string culture)
    {
        if (LocaleFiles.PathOf(contentPath.ContentRootPath, culture) is not { } path)
            return new Dictionary<string, string>();

        using FileStream stream = File.OpenRead(path);

        return JsonSerializer.Deserialize<Dictionary<string, string>>(stream) ?? new Dictionary<string, string>();
    }
}
