using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Infrastructure.Http;

public sealed record RegistryPackage(string? LatestVersion, string? Publisher, string? License = null,
    bool IsFailure = false, bool IsDeprecated = false)
{
    public static readonly RegistryPackage Unresolved = new(null, null, null);

    public static readonly RegistryPackage Failure = new(null, null, null, IsFailure: true);
}

public class DependencyRegistryClient(
    IHttpClientFactory httpClientFactory,
    IMemoryCache cache,
    InFlightRequestCoalescer coalescer) : IDependencyRegistryClient
{
    private const int MaxConcurrentRegistryRequests = 10;

    public async Task FetchRegistryMetadataAsync(List<Dependency> deps)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
        using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentRegistryRequests);

        IEnumerable<Task> tasks = deps
            .Where(d => d.Ecosystem is
                DependencyEcosystem.Npm or
                DependencyEcosystem.NuGet or
                DependencyEcosystem.PyPI or
                DependencyEcosystem.Maven or
                DependencyEcosystem.Go or
                DependencyEcosystem.Composer or
                DependencyEcosystem.Gem or
                DependencyEcosystem.Cargo or
                DependencyEcosystem.Hex or
                DependencyEcosystem.Pub)
            .Select(async dep =>
            {
                await throttle.WaitAsync();
                try { await ResolvePackageAsync(client, dep); }
                finally { throttle.Release(); }
            });
        await Task.WhenAll(tasks);
    }

    private async Task ResolvePackageAsync(HttpClient client, Dependency dep)
    {
        string cacheKey = CacheKeys.LatestVersion(dep.Ecosystem, dep.Name);

        if (cache.TryGetValue(cacheKey, out RegistryPackage? cached) && cached != null)
        {
            Apply(dep, cached);
            return;
        }

        RegistryPackage package = await coalescer.RunAsync(cacheKey, () => LoadPackageAsync(client, dep, cacheKey));

        Apply(dep, package);
    }

    private async Task<RegistryPackage> LoadPackageAsync(HttpClient client, Dependency dep, string cacheKey)
    {
        if (cache.TryGetValue(cacheKey, out RegistryPackage? cached) && cached != null)
            return cached;

        RegistryPackage package = await FetchPackageAsync(client, dep);

        if (package.IsFailure) return package;

        cache.Set(cacheKey, package, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = package.LatestVersion == null
                ? CacheKeys.LatestVersionUnresolvedTtl
                : CacheKeys.LatestVersionTtl,
            Size = 1
        });

        return package;
    }

    private static void Apply(Dependency dep, RegistryPackage package)
    {
        if (package.IsFailure) return;

        dep.LatestVersion = package.LatestVersion;
        dep.Publisher = package.Publisher ?? NamespacePublisher(dep);
        dep.License = package.License;
        dep.IsDeprecated = package.IsDeprecated;
    }

    private static string? NamespacePublisher(Dependency dep) => dep.Ecosystem switch
    {
        DependencyEcosystem.Maven => SegmentBefore(dep.Name, ':'),
        DependencyEcosystem.Composer => SegmentBefore(dep.Name, '/'),
        DependencyEcosystem.Npm when dep.Name.StartsWith('@') => SegmentBefore(dep.Name, '/')?.TrimStart('@'),
        DependencyEcosystem.Go => GoNamespace(dep.Name),
        _ => null,
    };

    private static string? SegmentBefore(string value, char separator)
    {
        int index = value.IndexOf(separator);
        return index > 0 ? value[..index] : null;
    }

    private static string? GoNamespace(string module)
    {
        string[] segments = module.Split('/');
        return segments.Length >= 2 ? segments[1] : null;
    }

    private static async Task<RegistryPackage> FetchPackageAsync(HttpClient client, Dependency dep)
    {
        try
        {
            return dep.Ecosystem switch
            {
                DependencyEcosystem.Npm => await FetchNpmAsync(client, dep.Name),
                DependencyEcosystem.NuGet => await FetchNuGetAsync(client, dep.Name),
                DependencyEcosystem.PyPI => await FetchPyPIAsync(client, dep.Name),
                DependencyEcosystem.Maven => await FetchMavenAsync(client, dep.Name),
                DependencyEcosystem.Go => await FetchGoAsync(client, dep.Name),
                DependencyEcosystem.Composer => await FetchPackagistAsync(client, dep.Name),
                DependencyEcosystem.Gem => await FetchRubyGemsAsync(client, dep.Name),
                DependencyEcosystem.Cargo => await FetchCratesAsync(client, dep.Name),
                DependencyEcosystem.Hex => await FetchHexAsync(client, dep.Name),
                DependencyEcosystem.Pub => await FetchPubAsync(client, dep.Name),
                _ => RegistryPackage.Unresolved,
            };
        }
        catch { return RegistryPackage.Failure; }
    }

    private static RegistryPackage Unsuccessful(HttpResponseMessage response) =>
        response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone
            ? RegistryPackage.Unresolved
            : RegistryPackage.Failure;

    private static async Task<RegistryPackage> FetchNpmAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://registry.npmjs.org/{Uri.EscapeDataString(package)}/latest");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        JsonElement root = doc.RootElement;

        string? version = Text(root, "version");
        string? publisher = PersonName(root, "author")
            ?? FirstPersonName(root, "maintainers")
            ?? PersonName(root, "_npmUser");
        string? license = Text(root, "license");
        bool isDeprecated = root.TryGetProperty("deprecated", out JsonElement deprecated)
            && deprecated.ValueKind == JsonValueKind.String;

        return new RegistryPackage(version, publisher, license, IsDeprecated: isDeprecated);
    }

    private static async Task<RegistryPackage> FetchNuGetAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync(
            $"https://azuresearch-usnc.nuget.org/query?q=packageid:{Uri.EscapeDataString(package)}&prerelease=false&take=1");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        if (!doc.RootElement.TryGetProperty("data", out JsonElement data)) return RegistryPackage.Unresolved;
        List<JsonElement> items = data.EnumerateArray().ToList();
        if (items.Count == 0) return RegistryPackage.Unresolved;

        return new RegistryPackage(Text(items[0], "version"), StringOrFirst(items[0], "authors"));
    }

    private static async Task<RegistryPackage> FetchPyPIAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://pypi.org/pypi/{Uri.EscapeDataString(package)}/json");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        if (!doc.RootElement.TryGetProperty("info", out JsonElement info)) return RegistryPackage.Unresolved;

        string? license = Text(info, "license") ?? ClassifierLicense(info);

        return new RegistryPackage(Text(info, "version"), Text(info, "author") ?? Text(info, "maintainer"), license);
    }

    private static string? ClassifierLicense(JsonElement info)
    {
        if (!info.TryGetProperty("classifiers", out JsonElement classifiers) || classifiers.ValueKind != JsonValueKind.Array)
            return null;

        foreach (JsonElement classifier in classifiers.EnumerateArray())
        {
            string? value = classifier.ValueKind == JsonValueKind.String ? classifier.GetString() : null;
            if (value == null || !value.StartsWith("License :: OSI Approved :: ", StringComparison.Ordinal)) continue;

            return Trim(value["License :: OSI Approved :: ".Length..]);
        }

        return null;
    }

    private static async Task<RegistryPackage> FetchMavenAsync(HttpClient client, string package)
    {
        string[] parts = package.Split(':');
        if (parts.Length < 2) return RegistryPackage.Unresolved;
        string groupPath = parts[0].Replace('.', '/');
        using HttpResponseMessage response = await client.GetAsync(
            $"https://repo1.maven.org/maven2/{Uri.EscapeDataString(groupPath).Replace("%2F", "/")}/{Uri.EscapeDataString(parts[1])}/maven-metadata.xml");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        XDocument doc = XDocument.Parse(await response.Content.ReadAsStringAsync());
        string? version = doc.Root?.Element("versioning")?.Element("release")?.Value
            ?? doc.Root?.Element("versioning")?.Element("latest")?.Value;

        return new RegistryPackage(version, doc.Root?.Element("groupId")?.Value ?? parts[0]);
    }

    private static async Task<RegistryPackage> FetchGoAsync(HttpClient client, string module)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://proxy.golang.org/{Uri.EscapeDataString(module)}/@latest");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        string? version = Text(doc.RootElement, "Version");

        return new RegistryPackage(version?.TrimStart('v'), null);
    }

    private static readonly Regex PackagistPrereleaseTag =
        new(@"-(dev|alpha|beta|rc)(\.|\d|$)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static async Task<RegistryPackage> FetchPackagistAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://packagist.org/packages/{Uri.EscapeDataString(package)}.json");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        if (!doc.RootElement.TryGetProperty("package", out JsonElement pkg)) return RegistryPackage.Unresolved;
        if (!pkg.TryGetProperty("versions", out JsonElement versions)) return RegistryPackage.Unresolved;
        List<string> stableVersions = versions.EnumerateObject()
            .Select(p => p.Name)
            .Where(v => !PackagistPrereleaseTag.IsMatch(v))
            .OrderByDescending(VersionText.Clean, VersionComparer.Instance)
            .ToList();
        string? version = stableVersions.Count > 0 ? VersionText.Clean(stableVersions[0]) : null;

        bool isAbandoned = pkg.TryGetProperty("abandoned", out JsonElement abandoned)
            && abandoned.ValueKind is JsonValueKind.True or JsonValueKind.String;

        return new RegistryPackage(version, FirstPersonName(pkg, "maintainers"), StringOrFirst(pkg, "license"),
            IsDeprecated: isAbandoned);
    }

    private static async Task<RegistryPackage> FetchRubyGemsAsync(HttpClient client, string gem)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://rubygems.org/api/v1/gems/{Uri.EscapeDataString(gem)}.json");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);

        return new RegistryPackage(Text(doc.RootElement, "version"), Text(doc.RootElement, "authors"),
            StringOrFirst(doc.RootElement, "licenses"));
    }

    private static async Task<RegistryPackage> FetchCratesAsync(HttpClient client, string crate)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://crates.io/api/v1/crates/{Uri.EscapeDataString(crate)}");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        if (!doc.RootElement.TryGetProperty("crate", out JsonElement crateObj)) return RegistryPackage.Unresolved;

        string? newestVersion = Text(crateObj, "newest_version");
        string? license = CrateVersionLicense(doc.RootElement, newestVersion);

        return new RegistryPackage(newestVersion, null, license);
    }

    private static string? CrateVersionLicense(JsonElement root, string? newestVersion)
    {
        if (!root.TryGetProperty("versions", out JsonElement versions) || versions.ValueKind != JsonValueKind.Array)
            return null;

        List<JsonElement> entries = versions.EnumerateArray().ToList();
        if (entries.Count == 0) return null;

        JsonElement target = entries.FirstOrDefault(v => Text(v, "num") == newestVersion, entries[0]);
        return Text(target, "license");
    }

    private static async Task<RegistryPackage> FetchHexAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://hex.pm/api/packages/{Uri.EscapeDataString(package)}");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        JsonElement root = doc.RootElement;
        bool hasMeta = root.TryGetProperty("meta", out JsonElement meta);

        string? publisher = FirstPersonName(root, "owners")
            ?? (hasMeta ? StringOrFirst(meta, "maintainers") : null);
        string? license = hasMeta ? StringOrFirst(meta, "licenses") : null;

        return new RegistryPackage(Text(root, "latest_stable_version"), publisher, license);
    }

    private static async Task<RegistryPackage> FetchPubAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://pub.dev/api/packages/{Uri.EscapeDataString(package)}");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        if (!doc.RootElement.TryGetProperty("latest", out JsonElement latest)) return RegistryPackage.Unresolved;

        string? publisher = latest.TryGetProperty("pubspec", out JsonElement pubspec)
            ? Text(pubspec, "publisher") ?? StringOrFirst(pubspec, "authors")
            : null;

        bool isDiscontinued = doc.RootElement.TryGetProperty("isDiscontinued", out JsonElement discontinued)
            && discontinued.ValueKind == JsonValueKind.True;

        return new RegistryPackage(Text(latest, "version"), publisher, IsDeprecated: isDiscontinued);
    }

    private static async Task<JsonDocument> ParseJsonAsync(HttpResponseMessage response)
    {
        await using Stream stream = await response.Content.ReadAsStreamAsync();
        return await JsonDocument.ParseAsync(stream);
    }

    private static string? Text(JsonElement element, string property) =>
        element.TryGetProperty(property, out JsonElement value) && value.ValueKind == JsonValueKind.String
            ? Trim(value.GetString())
            : null;

    private static string? StringOrFirst(JsonElement element, string property)
    {
        if (!element.TryGetProperty(property, out JsonElement value)) return null;

        return value.ValueKind switch
        {
            JsonValueKind.String => Trim(value.GetString()),
            JsonValueKind.Array => value.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => Trim(item.GetString()))
                .FirstOrDefault(item => item != null),
            _ => null,
        };
    }

    private static string? PersonName(JsonElement element, string property)
    {
        if (!element.TryGetProperty(property, out JsonElement person)) return null;

        return person.ValueKind switch
        {
            JsonValueKind.String => Trim(person.GetString()),
            JsonValueKind.Object => Text(person, "name"),
            _ => null,
        };
    }

    private static string? FirstPersonName(JsonElement element, string property)
    {
        if (!element.TryGetProperty(property, out JsonElement people) || people.ValueKind != JsonValueKind.Array)
            return null;

        foreach (JsonElement person in people.EnumerateArray())
        {
            string? name = person.ValueKind switch
            {
                JsonValueKind.String => Trim(person.GetString()),
                JsonValueKind.Object => Text(person, "name") ?? Text(person, "username"),
                _ => null,
            };

            if (name != null) return name;
        }

        return null;
    }

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
