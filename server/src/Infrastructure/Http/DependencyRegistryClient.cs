using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using Sentinel.Domain.Versioning;

namespace Sentinel.Infrastructure.Http;

public sealed record RegistryPackage(string? LatestVersion, string? Publisher, string? License = null,
    bool IsFailure = false, bool IsDeprecated = false)
{
    public static readonly RegistryPackage Unresolved = new(null, null, null);

    public static readonly RegistryPackage Failure = new(null, null, null, IsFailure: true);
}

public partial class DependencyRegistryClient(
    IHttpClientFactory httpClientFactory,
    IMemoryCache cache,
    InFlightRequestCoalescer coalescer) : IDependencyRegistryClient
{
    private const int MaxConcurrentRegistryRequests = 10;

    public async Task<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>> GetMetadataAsync(
        IReadOnlyCollection<RegistryPackageQuery> packages, CancellationToken cancellationToken)
    {
        HttpClient client = httpClientFactory.CreateClient(HttpClientNames.Registry);
        using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentRegistryRequests);

        (RegistryPackageQuery Query, RegistryPackage Package)[] resolved = await Task.WhenAll(packages
            .Where(package => package.Ecosystem is
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
            .Select(async package =>
            {
                await throttle.WaitAsync(cancellationToken);
                try { return (package, await ResolvePackageAsync(client, package, cancellationToken)); }
                finally { throttle.Release(); }
            }));

        return resolved
            .Where(entry => !entry.Package.IsFailure)
            .ToDictionary(entry => entry.Query, entry => new RegistryPackageMetadata(entry.Package.LatestVersion,
                entry.Package.Publisher, entry.Package.License, entry.Package.IsDeprecated));
    }

    private async Task<RegistryPackage> ResolvePackageAsync(HttpClient client, RegistryPackageQuery package,
        CancellationToken cancellationToken)
    {
        return await coalescer.GetOrLoadAsync(cache, CacheKeys.LatestVersion(package.Ecosystem, package.Name),
            () => FetchPackageAsync(client, package), CacheEntryFor, cancellationToken);
    }

    private static MemoryCacheEntryOptions? CacheEntryFor(RegistryPackage package) =>
        package.IsFailure
            ? null
            : new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = package.LatestVersion == null
                    ? CacheKeys.LatestVersionUnresolvedTtl
                    : CacheKeys.LatestVersionTtl,
                Size = 1
            };

    private static async Task<RegistryPackage> FetchPackageAsync(HttpClient client, RegistryPackageQuery dep)
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
        XDocument doc = UntrustedXml.Parse(await response.Content.ReadAsStringAsync());
        string? version = doc.Root?.Element("versioning")?.Element("release")?.Value
            ?? doc.Root?.Element("versioning")?.Element("latest")?.Value;

        return new RegistryPackage(version, doc.Root?.Element("groupId")?.Value ?? parts[0]);
    }

    private static string EncodeGoModulePath(string module) =>
        string.Concat(module.Select(character =>
            char.IsAsciiLetterUpper(character) ? $"!{char.ToLowerInvariant(character)}" : character.ToString()));

    private static async Task<RegistryPackage> FetchGoAsync(HttpClient client, string module)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://proxy.golang.org/{Uri.EscapeDataString(EncodeGoModulePath(module))}/@latest");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        string? version = Text(doc.RootElement, "Version");

        return new RegistryPackage(version?.TrimStart('v'), null);
    }

    [GeneratedRegex(@"-(dev|alpha|beta|rc)(\.|\d|$)", RegexOptions.IgnoreCase)]
    private static partial Regex PackagistPrereleaseTag();

    private static async Task<RegistryPackage> FetchPackagistAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync(
            $"https://repo.packagist.org/p2/{Uri.EscapeDataString(package).Replace("%2F", "/")}.json");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        if (!doc.RootElement.TryGetProperty("packages", out JsonElement packages)
            || !packages.TryGetProperty(package, out JsonElement releases)
            || releases.ValueKind != JsonValueKind.Array)
        {
            return RegistryPackage.Unresolved;
        }

        List<JsonElement> entries = releases.EnumerateArray().ToList();
        if (entries.Count == 0) return RegistryPackage.Unresolved;

        string? version = entries
            .Select(entry => Text(entry, "version"))
            .OfType<string>()
            .Where(v => !PackagistPrereleaseTag().IsMatch(v))
            .Select(VersionText.Clean)
            .OrderByDescending(v => v, VersionComparer.Instance)
            .FirstOrDefault();

        JsonElement newest = entries[0];
        bool isAbandoned = newest.TryGetProperty("abandoned", out JsonElement abandoned)
            && abandoned.ValueKind is JsonValueKind.True or JsonValueKind.String;

        return new RegistryPackage(version, FirstPersonName(newest, "authors"), StringOrFirst(newest, "license"),
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
        using HttpResponseMessage response = await client.GetAsync(
            $"https://crates.io/api/v1/crates/{Uri.EscapeDataString(crate)}?include=default_version");
        if (!response.IsSuccessStatusCode) return Unsuccessful(response);
        using JsonDocument doc = await ParseJsonAsync(response);
        if (!doc.RootElement.TryGetProperty("crate", out JsonElement crateObj)) return RegistryPackage.Unresolved;

        string? defaultVersion = Text(crateObj, "default_version") ?? Text(crateObj, "newest_version");
        string? license = CrateVersionLicense(doc.RootElement, defaultVersion);

        return new RegistryPackage(defaultVersion, null, license);
    }

    private static string? CrateVersionLicense(JsonElement root, string? version)
    {
        if (!root.TryGetProperty("versions", out JsonElement versions) || versions.ValueKind != JsonValueKind.Array)
            return null;

        List<JsonElement> entries = versions.EnumerateArray().ToList();
        if (entries.Count == 0) return null;

        JsonElement target = entries.FirstOrDefault(v => Text(v, "num") == version, entries[0]);
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
