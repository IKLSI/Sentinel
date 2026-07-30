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
    private static readonly Dictionary<DependencyEcosystem, string> OsvEcosystemMap = new()
    {
        [DependencyEcosystem.Npm] = "npm",
        [DependencyEcosystem.PyPI] = "PyPI",
        [DependencyEcosystem.NuGet] = "NuGet",
        [DependencyEcosystem.Maven] = "Maven",
        [DependencyEcosystem.Go] = "Go",
        [DependencyEcosystem.Composer] = "Packagist",
        [DependencyEcosystem.Gem] = "RubyGems",
        [DependencyEcosystem.Cargo] = "crates.io",
        [DependencyEcosystem.Gradle] = "Maven",
        [DependencyEcosystem.Hex] = "Hex",
        [DependencyEcosystem.Pub] = "Pub",
        [DependencyEcosystem.Swift] = "SwiftURL",
    };

    private sealed record VulnerabilityScanResult(Dependency Dependency, DependencyStatus? Status, List<Vulnerability> NewVulnerabilities);

    private const int OsvBatchSize = 500;

    private async Task<List<VulnerabilityScanResult>> FetchVulnerabilitiesBatchAsync(IReadOnlyList<Dependency> dependencies)
    {
        List<(Dependency Dep, string Ecosystem)> mapped = new();
        foreach (Dependency dep in dependencies)
        {
            if (OsvEcosystemMap.TryGetValue(dep.Ecosystem, out string? ecosystem))
                mapped.Add((dep, ecosystem));
        }

        if (mapped.Count == 0) return new List<VulnerabilityScanResult>();

        List<string>?[] depVulnIds = new List<string>?[mapped.Count];

        for (int start = 0; start < mapped.Count; start += OsvBatchSize)
        {
            List<(Dependency Dep, string Ecosystem)> chunk = mapped.Skip(start).Take(OsvBatchSize).ToList();

            var batchBody = new
            {
                queries = chunk.Select(m => new
                {
                    version = m.Dep.CurrentVersion,
                    package = new { name = m.Dep.Name, ecosystem = m.Ecosystem }
                }).ToArray()
            };

            try
            {
                HttpResponseMessage response =
                    await _osvClient.PostAsJsonAsync("https://api.osv.dev/v1/querybatch", batchBody);
                if (!response.IsSuccessStatusCode) continue;

                using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                if (!doc.RootElement.TryGetProperty("results", out JsonElement results)) continue;

                int i = 0;
                foreach (JsonElement result in results.EnumerateArray())
                {
                    if (i >= chunk.Count) break;

                    List<string> ids = new();
                    if (result.TryGetProperty("vulns", out JsonElement vulns))
                    {
                        foreach (JsonElement v in vulns.EnumerateArray())
                        {
                            if (v.TryGetProperty("id", out JsonElement idProp) && idProp.GetString() is { } id)
                                ids.Add(id);
                        }
                    }

                    depVulnIds[start + i] = ids;
                    i++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erreur OSV querybatch (lot {Start})", start);
            }
        }

        HashSet<string> idsToHydrate = new();
        for (int i = 0; i < mapped.Count; i++)
        {
            List<string>? ids = depVulnIds[i];
            if (ids == null) continue;

            HashSet<string> existing = mapped[i].Dep.Vulnerabilities.Select(v => v.CveId).ToHashSet();
            foreach (string id in ids)
            {
                if (!existing.Contains(id)) idsToHydrate.Add(id);
            }
        }

        Dictionary<string, JsonDocument> details = await FetchVulnDetailsAsync(idsToHydrate);

        try
        {
            List<VulnerabilityScanResult> scanResults = new();

            for (int i = 0; i < mapped.Count; i++)
            {
                Dependency dep = mapped[i].Dep;
                List<string>? ids = depVulnIds[i];
                if (ids == null) continue;

                if (ids.Count == 0)
                {
                    scanResults.Add(new VulnerabilityScanResult(dep, DependencyStatus.UpToDate, new List<Vulnerability>()));
                    continue;
                }

                HashSet<string> existingCves = dep.Vulnerabilities.Select(v => v.CveId).ToHashSet();
                List<Vulnerability> newVulns = new();

                foreach (string id in ids)
                {
                    if (existingCves.Contains(id)) continue;
                    if (!details.TryGetValue(id, out JsonDocument? detailDoc)) continue;

                    JsonElement vuln = detailDoc.RootElement;
                    (decimal cvss, VulnerabilitySeverity severity) = ExtractSeverity(vuln);
                    string? fixedVersion = ExtractFixedVersion(vuln, dep.Name);
                    string? advisoryUrl = ExtractAdvisoryUrl(vuln, id);
                    string summary = vuln.TryGetProperty("summary", out JsonElement sumProp)
                        ? sumProp.GetString() ?? string.Empty
                        : string.Empty;

                    newVulns.Add(new Vulnerability
                    {
                        DependencyId = dep.Id,
                        CveId = id,
                        CvssScore = cvss,
                        Description = summary,
                        PackageName = dep.Name,
                        FixedVersion = fixedVersion,
                        AdvisoryUrl = advisoryUrl,
                        Severity = severity,
                        DetectedAt = DateTime.UtcNow
                    });
                }

                if (newVulns.Count > 0)
                    scanResults.Add(new VulnerabilityScanResult(dep, DependencyStatus.Vulnerable, newVulns));
            }

            return scanResults;
        }
        finally
        {
            foreach (JsonDocument doc in details.Values) doc.Dispose();
        }
    }

    private async Task<Dictionary<string, JsonDocument>> FetchVulnDetailsAsync(HashSet<string> ids)
    {
        Dictionary<string, JsonDocument> details = new();
        if (ids.Count == 0) return details;

        using SemaphoreSlim throttle = new SemaphoreSlim(10);

        IEnumerable<Task<(string Id, JsonDocument? Doc)>> tasks = ids.Select(async id =>
        {
            await throttle.WaitAsync();
            try
            {
                HttpResponseMessage response = await _osvClient.GetAsync($"https://api.osv.dev/v1/vulns/{id}");
                if (!response.IsSuccessStatusCode) return (id, (JsonDocument?)null);

                return (id, (JsonDocument?)JsonDocument.Parse(await response.Content.ReadAsStringAsync()));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erreur détail OSV pour {VulnId}", id);
                return (id, (JsonDocument?)null);
            }
            finally { throttle.Release(); }
        });

        foreach ((string id, JsonDocument? doc) in await Task.WhenAll(tasks))
        {
            if (doc != null) details[id] = doc;
        }

        return details;
    }

}
