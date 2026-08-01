using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Versioning;

namespace Sentinel.Infrastructure.Http;

public class DependencyRegistryClient(IHttpClientFactory httpClientFactory, IMemoryCache cache) : IDependencyRegistryClient
{
    private const int MaxConcurrentRegistryRequests = 10;

    public async Task FetchLatestVersionsAsync(List<Dependency> deps)
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
                try { await ResolveLatestVersionAsync(client, dep); }
                finally { throttle.Release(); }
            });
        await Task.WhenAll(tasks);
    }

    private async Task ResolveLatestVersionAsync(HttpClient client, Dependency dep)
    {
        string cacheKey = CacheKeys.LatestVersion(dep.Ecosystem, dep.Name);

        if (cache.TryGetValue(cacheKey, out string? cachedVersion))
        {
            dep.LatestVersion = cachedVersion;
            return;
        }

        string? version = await FetchLatestVersionAsync(client, dep);

        dep.LatestVersion = version;
        cache.Set(cacheKey, version, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow =
                version == null ? CacheKeys.LatestVersionUnresolvedTtl : CacheKeys.LatestVersionTtl,
            Size = 1
        });
    }

    private static async Task<string?> FetchLatestVersionAsync(HttpClient client, Dependency dep)
    {
        try
        {
            return dep.Ecosystem switch
            {
                DependencyEcosystem.Npm => await FetchNpmLatestAsync(client, dep.Name),
                DependencyEcosystem.NuGet => await FetchNuGetLatestAsync(client, dep.Name),
                DependencyEcosystem.PyPI => await FetchPyPILatestAsync(client, dep.Name),
                DependencyEcosystem.Maven => await FetchMavenLatestAsync(client, dep.Name),
                DependencyEcosystem.Go => await FetchGoLatestAsync(client, dep.Name),
                DependencyEcosystem.Composer => await FetchPackagistLatestAsync(client, dep.Name),
                DependencyEcosystem.Gem => await FetchRubyGemsLatestAsync(client, dep.Name),
                DependencyEcosystem.Cargo => await FetchCratesLatestAsync(client, dep.Name),
                DependencyEcosystem.Hex => await FetchHexLatestAsync(client, dep.Name),
                DependencyEcosystem.Pub => await FetchPubLatestAsync(client, dep.Name),
                _ => null,
            };
        }
        catch { return null; }
    }

    private static async Task<string?> FetchNpmLatestAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://registry.npmjs.org/{Uri.EscapeDataString(package)}/latest");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("version", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchNuGetLatestAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync(
            $"https://azuresearch-usnc.nuget.org/query?q=packageid:{Uri.EscapeDataString(package)}&prerelease=false&take=1");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!doc.RootElement.TryGetProperty("data", out JsonElement data)) return null;
        List<JsonElement> items = data.EnumerateArray().ToList();
        if (items.Count == 0) return null;
        return items[0].TryGetProperty("version", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchPyPILatestAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://pypi.org/pypi/{Uri.EscapeDataString(package)}/json");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("info", out JsonElement info) && info.TryGetProperty("version", out JsonElement v)
            ? v.GetString() : null;
    }

    private static async Task<string?> FetchMavenLatestAsync(HttpClient client, string package)
    {
        string[] parts = package.Split(':');
        if (parts.Length < 2) return null;
        string groupPath = parts[0].Replace('.', '/');
        using HttpResponseMessage response = await client.GetAsync(
            $"https://repo1.maven.org/maven2/{Uri.EscapeDataString(groupPath).Replace("%2F", "/")}/{Uri.EscapeDataString(parts[1])}/maven-metadata.xml");
        if (!response.IsSuccessStatusCode) return null;
        XDocument doc = XDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.Root?.Element("versioning")?.Element("release")?.Value
            ?? doc.Root?.Element("versioning")?.Element("latest")?.Value;
    }

    private static async Task<string?> FetchGoLatestAsync(HttpClient client, string module)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://proxy.golang.org/{Uri.EscapeDataString(module)}/@latest");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        string? version = doc.RootElement.TryGetProperty("Version", out JsonElement v) ? v.GetString() : null;
        return version?.TrimStart('v');
    }

    private static readonly Regex PackagistPrereleaseTag =
        new(@"-(dev|alpha|beta|rc)(\.|\d|$)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static async Task<string?> FetchPackagistLatestAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://packagist.org/packages/{Uri.EscapeDataString(package)}.json");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!doc.RootElement.TryGetProperty("package", out JsonElement pkg)) return null;
        if (!pkg.TryGetProperty("versions", out JsonElement versions)) return null;
        List<string> stableVersions = versions.EnumerateObject()
            .Select(p => p.Name)
            .Where(v => !PackagistPrereleaseTag.IsMatch(v))
            .OrderByDescending(VersionText.Clean, VersionComparer.Instance)
            .ToList();
        return stableVersions.Count > 0 ? VersionText.Clean(stableVersions[0]) : null;
    }

    private static async Task<string?> FetchRubyGemsLatestAsync(HttpClient client, string gem)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://rubygems.org/api/v1/gems/{Uri.EscapeDataString(gem)}.json");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("version", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchCratesLatestAsync(HttpClient client, string crate)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://crates.io/api/v1/crates/{Uri.EscapeDataString(crate)}");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!doc.RootElement.TryGetProperty("crate", out JsonElement crateObj)) return null;
        return crateObj.TryGetProperty("newest_version", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchHexLatestAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://hex.pm/api/packages/{Uri.EscapeDataString(package)}");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("latest_stable_version", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchPubLatestAsync(HttpClient client, string package)
    {
        using HttpResponseMessage response = await client.GetAsync($"https://pub.dev/api/packages/{Uri.EscapeDataString(package)}");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("latest", out JsonElement latest) && latest.TryGetProperty("version", out JsonElement v)
            ? v.GetString() : null;
    }
}
