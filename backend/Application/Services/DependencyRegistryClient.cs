using System.Text.Json;
using TMAflow.Domain.Models;

namespace TMAflow.Application.Services;

public class DependencyRegistryClient
{
    private readonly IHttpClientFactory _httpClientFactory;

    public DependencyRegistryClient(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task FetchLatestVersionsAsync(List<Dependency> deps)
    {
        IEnumerable<Task> tasks = deps
            .Where(d => d.Ecosystem is
                DependencyEcosystem.Npm or
                DependencyEcosystem.NuGet or
                DependencyEcosystem.PyPI or
                DependencyEcosystem.Maven or
                DependencyEcosystem.Go or
                DependencyEcosystem.Composer or
                DependencyEcosystem.Gem or
                DependencyEcosystem.Cargo)
            .Select(FetchLatestVersionAsync);
        await Task.WhenAll(tasks);
    }

    public static DependencyStatus ComputeStatus(string current, string? latest)
    {
        if (string.IsNullOrEmpty(latest) || current == latest) return DependencyStatus.UpToDate;

        int[] curParts = current.Split('.').Select(p => int.TryParse(p, out int n) ? n : 0).ToArray();
        int[] latParts = latest.Split('.').Select(p => int.TryParse(p, out int n) ? n : 0).ToArray();

        int curMajor = curParts.Length > 0 ? curParts[0] : 0;
        int latMajor = latParts.Length > 0 ? latParts[0] : 0;

        return latMajor > curMajor ? DependencyStatus.MajorUpdate : DependencyStatus.MinorUpdate;
    }

    private async Task FetchLatestVersionAsync(Dependency dep)
    {
        try
        {
            HttpClient client = _httpClientFactory.CreateClient("Registry");
            dep.LatestVersion = dep.Ecosystem switch
            {
                DependencyEcosystem.Npm => await FetchNpmLatestAsync(client, dep.Name),
                DependencyEcosystem.NuGet => await FetchNuGetLatestAsync(client, dep.Name),
                DependencyEcosystem.PyPI => await FetchPyPILatestAsync(client, dep.Name),
                DependencyEcosystem.Maven => await FetchMavenLatestAsync(client, dep.Name),
                DependencyEcosystem.Go => await FetchGoLatestAsync(client, dep.Name),
                DependencyEcosystem.Composer => await FetchPackagistLatestAsync(client, dep.Name),
                DependencyEcosystem.Gem => await FetchRubyGemsLatestAsync(client, dep.Name),
                DependencyEcosystem.Cargo => await FetchCratesLatestAsync(client, dep.Name),
                _ => null,
            };
        }
        catch { }
    }

    private static async Task<string?> FetchNpmLatestAsync(HttpClient client, string package)
    {
        HttpResponseMessage response = await client.GetAsync($"https://registry.npmjs.org/{Uri.EscapeDataString(package)}/latest");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("version", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchNuGetLatestAsync(HttpClient client, string package)
    {
        HttpResponseMessage response = await client.GetAsync(
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
        HttpResponseMessage response = await client.GetAsync($"https://pypi.org/pypi/{Uri.EscapeDataString(package)}/json");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("info", out JsonElement info) && info.TryGetProperty("version", out JsonElement v)
            ? v.GetString() : null;
    }

    private static async Task<string?> FetchMavenLatestAsync(HttpClient client, string package)
    {
        string[] parts = package.Split(':');
        if (parts.Length < 2) return null;
        HttpResponseMessage response = await client.GetAsync(
            $"https://search.maven.org/solrsearch/select?q=g:{Uri.EscapeDataString(parts[0])}+AND+a:{Uri.EscapeDataString(parts[1])}&rows=1&wt=json");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!doc.RootElement.TryGetProperty("response", out JsonElement resp)) return null;
        if (!resp.TryGetProperty("docs", out JsonElement docs)) return null;
        List<JsonElement> docsList = docs.EnumerateArray().ToList();
        if (docsList.Count == 0) return null;
        return docsList[0].TryGetProperty("latestVersion", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchGoLatestAsync(HttpClient client, string module)
    {
        HttpResponseMessage response = await client.GetAsync($"https://proxy.golang.org/{module}/@latest");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        string? version = doc.RootElement.TryGetProperty("Version", out JsonElement v) ? v.GetString() : null;
        return version?.TrimStart('v');
    }

    private static async Task<string?> FetchPackagistLatestAsync(HttpClient client, string package)
    {
        HttpResponseMessage response = await client.GetAsync($"https://packagist.org/packages/{package}.json");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!doc.RootElement.TryGetProperty("package", out JsonElement pkg)) return null;
        if (!pkg.TryGetProperty("versions", out JsonElement versions)) return null;
        List<string> stableVersions = versions.EnumerateObject()
            .Select(p => p.Name)
            .Where(v => !v.Contains("dev") && !v.Contains("alpha") && !v.Contains("beta") && !v.Contains("RC"))
            .OrderByDescending(v => v)
            .ToList();
        return stableVersions.Count > 0 ? ManifestParserService.CleanVersion(stableVersions[0]) : null;
    }

    private static async Task<string?> FetchRubyGemsLatestAsync(HttpClient client, string gem)
    {
        HttpResponseMessage response = await client.GetAsync($"https://rubygems.org/api/v1/gems/{Uri.EscapeDataString(gem)}.json");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("version", out JsonElement v) ? v.GetString() : null;
    }

    private static async Task<string?> FetchCratesLatestAsync(HttpClient client, string crate)
    {
        HttpResponseMessage response = await client.GetAsync($"https://crates.io/api/v1/crates/{Uri.EscapeDataString(crate)}");
        if (!response.IsSuccessStatusCode) return null;
        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!doc.RootElement.TryGetProperty("crate", out JsonElement crateObj)) return null;
        return crateObj.TryGetProperty("newest_version", out JsonElement v) ? v.GetString() : null;
    }
}
