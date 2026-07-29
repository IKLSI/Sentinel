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

public class TechHealthService
{
    private const int MaxOutdatedPenalty = 40;
    private const int MajorUpdateWeight = 2;
    private const int MinorUpdateWeight = 1;
    private const int CriticalPenalty = 15;
    private const int HighPenalty = 10;
    private const int MediumPenalty = 5;
    private const int LowPenalty = 2;
    private const int EolDependencyPenalty = 10;
    private const int EolRuntimePenalty = 15;
    private const int ScoreDecayConstant = 150;
    private const int MaxScore = 100;

    private readonly IProjectRepository _projectRepository;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IDependencyRepository _dependencyRepository;
    private readonly IVulnerabilityRepository _vulnerabilityRepository;
    private readonly IRuntimeRepository _runtimeRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICommitScopeFactory _commitScopeFactory;
    private readonly HttpClient _osvClient;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TechHealthService> _logger;
    private readonly RepositoryScannerService _repositoryScanner;
    private readonly TokenProtector _tokenProtector;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;
    private readonly IMemoryCache _cache;

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

    public TechHealthService(
        IProjectRepository projectRepository,
        IOrganizationRepository organizationRepository,
        IDependencyRepository dependencyRepository,
        IVulnerabilityRepository vulnerabilityRepository,
        IRuntimeRepository runtimeRepository,
        IUserRepository userRepository,
        ICommitScopeFactory commitScopeFactory,
        IHttpClientFactory httpClientFactory,
        ILogger<TechHealthService> logger,
        RepositoryScannerService repositoryScanner,
        TokenProtector tokenProtector,
        IServiceScopeFactory scopeFactory,
        IBackgroundJobClient backgroundJobs,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope,
        IMemoryCache cache)
    {
        _projectRepository = projectRepository;
        _organizationRepository = organizationRepository;
        _dependencyRepository = dependencyRepository;
        _vulnerabilityRepository = vulnerabilityRepository;
        _runtimeRepository = runtimeRepository;
        _userRepository = userRepository;
        _commitScopeFactory = commitScopeFactory;
        _httpClientFactory = httpClientFactory;
        _osvClient = httpClientFactory.CreateClient(HttpClientNames.Osv);
        _logger = logger;
        _repositoryScanner = repositoryScanner;
        _tokenProtector = tokenProtector;
        _scopeFactory = scopeFactory;
        _backgroundJobs = backgroundJobs;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
        _cache = cache;
    }

    public async Task ScanProjectAsync(Guid projectId)
    {
        using IDisposable elevation = _systemScope.Enter();

        Project? project = await _projectRepository.GetOrDefaultAsync(projectId,
            QueryTracking.Tracked, CancellationToken.None);

        if (project == null) return;

        bool isFirstScan = project.LastScanAt == null;

        HashSet<string> previousCveIds =
            await _vulnerabilityRepository.GetCveIdsByProjectAsync(projectId, CancellationToken.None);

        string? scanError = null;
        int manifestsRead = 0;
        bool scanRan = false;

        if (!string.IsNullOrEmpty(project.RepositoryUrl))
        {
            scanRan = true;
            string? tokenOverride = null;
            Organization? org = await _organizationRepository.GetOrDefaultAsync(project.OrganizationId,
                QueryTracking.Tracked, CancellationToken.None);

            if (org != null)
            {
                string? stored = project.RepositoryType == RepositoryType.GitLab
                    ? org.GitlabToken
                    : org.GithubToken;
                tokenOverride = _tokenProtector.Unprotect(stored);
            }

            ScanOutcome outcome =
                await _repositoryScanner.ScanRepositoryAsync(project.Id, project.RepositoryUrl, tokenOverride);
            scanError = outcome.Error;
            manifestsRead = outcome.ManifestsRead;

            if (outcome.Dependencies.Count > 0 || outcome.Runtimes.Count > 0)
            {
                await _commitScopeFactory.ExecuteInTransactionAsync(async token =>
                {
                    await _vulnerabilityRepository.DeleteByProjectAsync(projectId, token);
                    await _dependencyRepository.DeleteByProjectAsync(projectId, token);
                    await _runtimeRepository.DeleteByProjectAsync(projectId, token);
                    await _dependencyRepository.AddRangeAsync(outcome.Dependencies, token);
                    await _runtimeRepository.AddRangeAsync(outcome.Runtimes, token);
                }, CancellationToken.None);
            }
            else if (scanError != null)
            {
                _logger.LogWarning("Scan de {Url} échoué : {Error} — données existantes conservées", project.RepositoryUrl, scanError);
            }
            else
            {
                _logger.LogWarning("Scan de {Url} : aucune donnée retournée, données existantes conservées", project.RepositoryUrl);
            }
        }

        if (!project.Dependencies.Any() && !project.Runtimes.Any())
        {
            project = (await _projectRepository
                .GetOrDefaultWithHealthDetailsAsync(projectId, QueryTracking.Tracked, CancellationToken.None))!;
        }

        using SemaphoreSlim throttle = new SemaphoreSlim(10);

        async Task<T> RunThrottledAsync<T>(Func<Task<T>> work)
        {
            await throttle.WaitAsync();
            try { return await work(); }
            finally { throttle.Release(); }
        }

        List<VulnerabilityScanResult> vulnResults =
            await FetchVulnerabilitiesBatchAsync(project.Dependencies.ToList());

        RuntimeEolResult?[] eolResults = await Task.WhenAll(project.Runtimes.Select(r =>
            RunThrottledAsync(() => FetchRuntimeEolAsync(r))));

        foreach (VulnerabilityScanResult result in vulnResults)
        {
            if (result.Status is { } status) result.Dependency.Status = status;
            foreach (Vulnerability vuln in result.NewVulnerabilities)
            {
                result.Dependency.Vulnerabilities.Add(vuln);
                await _vulnerabilityRepository.AddAsync(vuln, CancellationToken.None);
            }
        }

        foreach (RuntimeEolResult result in eolResults.OfType<RuntimeEolResult>())
        {
            if (result.IsEol is { } isEol) result.Runtime.IsEol = isEol;
            if (result.EolDate is { } eolDate) result.Runtime.EolDate = eolDate;
        }

        project.Coverage = ResolveCoverage(project, scanRan, scanError, manifestsRead);
        project.HealthScore = project.Coverage == ScanCoverage.Covered ? CalculateHealthScore(project) : null;
        project.HealthGrade = project.HealthScore is { } score ? ScoreToGrade(score) : null;
        project.LastScanAt = DateTime.UtcNow;
        project.LastScanError = scanError;

        foreach (Dependency dep in project.Dependencies)
            dep.ScannedAt = DateTime.UtcNow;

        Organization? scanOrg = await _organizationRepository.GetOrDefaultAsync(project.OrganizationId,
            QueryTracking.Tracked, CancellationToken.None);

        if (scanOrg != null)
        {
            ScanPeriod.ResetIfElapsed(scanOrg);
            scanOrg.MonthlyScanCount++;
        }

        using (ICommitScope commitScope = _commitScopeFactory.Begin())
        {
            await commitScope.CommitAsync(CancellationToken.None);
        }

        _cache.Remove(CacheKeys.Dashboard(project.OrganizationId));

        await TrySendVulnerabilityAlertAsync(project, isFirstScan, previousCveIds);
    }

    private async Task TrySendVulnerabilityAlertAsync(Project project, bool isFirstScan, HashSet<string> previousCveIds)
    {
        try
        {
            Organization? org = await _organizationRepository.GetOrDefaultAsync(project.OrganizationId,
                QueryTracking.NoTracking, CancellationToken.None);

            if (org == null || !org.SecurityAlertsEnabled) return;

            List<Vulnerability> allVulns = project.Dependencies
                .SelectMany(d => d.Vulnerabilities)
                .ToList();

            List<Vulnerability> newVulns = (isFirstScan
                ? allVulns
                : allVulns.Where(v => !previousCveIds.Contains(v.CveId)))
                .Where(v => v.Severity <= org.AlertMinSeverity)
                .ToList();

            if (newVulns.Count == 0) return;

            IReadOnlyList<string> adminEmails =
                await _userRepository.ListAdminEmailsAsync(project.OrganizationId, CancellationToken.None);

            if (adminEmails.Count == 0) return;

            string organizationName = org.Name;
            string frontendBase = _frontend.BaseUrl;
            string projectUrl = $"{frontendBase}/projects/{project.Id}";

            List<VulnerabilityAlertEntry> entries = newVulns
                .OrderBy(v => v.Severity)
                .Select(v => new VulnerabilityAlertEntry(v.CveId, v.PackageName, v.Severity.ToString(), v.CvssScore, v.FixedVersion))
                .ToList();

            string projectName = project.Name;
            _backgroundJobs.Enqueue<IEmailService>(s => s.SendVulnerabilityAlertAsync(adminEmails, projectName, organizationName, projectUrl, isFirstScan, entries));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Impossible d'envoyer l'alerte vulnérabilités pour le projet {ProjectId}", project.Id);
        }
    }

    public async Task ScanAllProjectsDueAsync()
    {
        IReadOnlyList<Guid> daily = await GetProjectsDueAsync(ScanFrequency.Daily, 1);
        IReadOnlyList<Guid> weekly = await GetProjectsDueAsync(ScanFrequency.Weekly, 7);
        IReadOnlyList<Guid> monthly = await GetProjectsDueAsync(ScanFrequency.Monthly, 30);

        using SemaphoreSlim throttle = new SemaphoreSlim(5);
        await Task.WhenAll(daily.Concat(weekly).Concat(monthly).Select(async projectId =>
        {
            await throttle.WaitAsync();
            try
            {
                using IServiceScope scope = _scopeFactory.CreateScope();
                TechHealthService scoped = scope.ServiceProvider.GetRequiredService<TechHealthService>();
                await scoped.ScanProjectAsync(projectId);
            }
            catch (Exception ex) { _logger.LogError(ex, "Erreur scan projet {ProjectId}", projectId); }
            finally { throttle.Release(); }
        }));
    }

    private Task<IReadOnlyList<Guid>> GetProjectsDueAsync(ScanFrequency frequency, int elapsedDays)
    {
        DateTime threshold = DateTime.UtcNow.AddDays(-elapsedDays);

        return _projectRepository.ListIdsDueForScanAsync(frequency, threshold, CancellationToken.None);
    }

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

    private static (decimal cvss, VulnerabilitySeverity severity) ExtractSeverity(JsonElement vuln)
    {
        // 1. database_specific.cvss.baseScore (GitHub Advisory — score numérique direct)
        if (vuln.TryGetProperty("database_specific", out JsonElement dbSpecific))
        {
            if (dbSpecific.TryGetProperty("cvss", out JsonElement cvssObj) &&
                cvssObj.TryGetProperty("baseScore", out JsonElement baseScoreProp) &&
                baseScoreProp.TryGetDecimal(out decimal score))
            {
                return (score, ScoreToSeverity(score));
            }

            if (dbSpecific.TryGetProperty("severity", out JsonElement sevStr))
            {
                VulnerabilitySeverity sev = sevStr.GetString()?.ToUpperInvariant() switch
                {
                    "CRITICAL" => VulnerabilitySeverity.Critical,
                    "HIGH" => VulnerabilitySeverity.High,
                    "MODERATE" or "MEDIUM" => VulnerabilitySeverity.Medium,
                    "LOW" => VulnerabilitySeverity.Low,
                    _ => VulnerabilitySeverity.Medium
                };
                return (SeverityToDefaultScore(sev), sev);
            }
        }

        // 2. Fallback heuristique sur le vecteur CVSS v3
        if (vuln.TryGetProperty("severity", out JsonElement severityArr))
        {
            foreach (JsonElement sev in severityArr.EnumerateArray())
            {
                if (sev.TryGetProperty("score", out JsonElement scoreProp))
                {
                    string? vector = scoreProp.GetString();
                    if (vector != null)
                    {
                        VulnerabilitySeverity estimatedSev = EstimateSeverityFromVector(vector);
                        return (SeverityToDefaultScore(estimatedSev), estimatedSev);
                    }
                }
            }
        }

        return (SeverityToDefaultScore(VulnerabilitySeverity.Medium), VulnerabilitySeverity.Medium);
    }

    private static VulnerabilitySeverity ScoreToSeverity(decimal score) => score switch
    {
        >= 9.0m => VulnerabilitySeverity.Critical,
        >= 7.0m => VulnerabilitySeverity.High,
        >= 4.0m => VulnerabilitySeverity.Medium,
        _ => VulnerabilitySeverity.Low
    };

    private static decimal SeverityToDefaultScore(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => 9.5m,
        VulnerabilitySeverity.High     => 7.5m,
        VulnerabilitySeverity.Medium   => 5.0m,
        _                              => 2.0m
    };

    private static VulnerabilitySeverity EstimateSeverityFromVector(string vector)
    {
        bool critConfInt = vector.Contains("/C:H") && vector.Contains("/I:H");
        bool highImpact = vector.Contains("/C:H") || vector.Contains("/I:H") || vector.Contains("/A:H");
        bool lowPriv = vector.Contains("/PR:N") || vector.Contains("/PR:L");

        if (critConfInt && lowPriv) return VulnerabilitySeverity.Critical;
        if (highImpact) return VulnerabilitySeverity.High;
        if (vector.Contains("/C:L") || vector.Contains("/I:L") || vector.Contains("/A:L"))
            return VulnerabilitySeverity.Medium;
        return VulnerabilitySeverity.Low;
    }

    private static string? ExtractFixedVersion(JsonElement vuln, string packageName)
    {
        if (!vuln.TryGetProperty("affected", out JsonElement affected)) return null;

        foreach (JsonElement affectedEntry in affected.EnumerateArray())
        {
            if (affectedEntry.TryGetProperty("package", out JsonElement pkg))
            {
                string? name = pkg.TryGetProperty("name", out JsonElement n) ? n.GetString() : null;
                if (name != null && !name.Equals(packageName, StringComparison.OrdinalIgnoreCase)) continue;
            }

            if (!affectedEntry.TryGetProperty("ranges", out JsonElement ranges)) continue;

            foreach (JsonElement range in ranges.EnumerateArray())
            {
                if (!range.TryGetProperty("events", out JsonElement events)) continue;

                foreach (JsonElement evt in events.EnumerateArray())
                {
                    if (evt.TryGetProperty("fixed", out JsonElement fixedProp))
                        return fixedProp.GetString();
                }
            }
        }

        return null;
    }

    private static string? ExtractAdvisoryUrl(JsonElement vuln, string id)
    {
        if (vuln.TryGetProperty("references", out JsonElement refs))
        {
            foreach (JsonElement r in refs.EnumerateArray())
            {
                if (r.TryGetProperty("type", out JsonElement t) && t.GetString() == "ADVISORY" &&
                    r.TryGetProperty("url", out JsonElement urlProp))
                    return urlProp.GetString();
            }

            foreach (JsonElement r in refs.EnumerateArray())
            {
                if (r.TryGetProperty("url", out JsonElement urlProp))
                    return urlProp.GetString();
            }
        }

        if (id.StartsWith("GHSA-", StringComparison.OrdinalIgnoreCase))
            return $"https://github.com/advisories/{id}";

        return null;
    }

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
            HttpResponseMessage response = await eolClient.GetAsync($"https://endoflife.date/api/{product}/{cycle}.json");
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

    public static ScanCoverage ResolveCoverage(Project project, bool scanRan, string? scanError, int manifestsRead)
    {
        if (project.Dependencies.Any() || project.Runtimes.Any()) return ScanCoverage.Covered;
        if (!scanRan) return ScanCoverage.NotScanned;
        if (scanError != null) return ScanCoverage.Failed;
        return manifestsRead == 0 ? ScanCoverage.NoManifest : ScanCoverage.NoDependencies;
    }

    private static int SeverityPenalty(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => CriticalPenalty,
        VulnerabilitySeverity.High => HighPenalty,
        VulnerabilitySeverity.Medium => MediumPenalty,
        VulnerabilitySeverity.Low => LowPenalty,
        _ => 0
    };

    private static int OutdatedPenalty(Project project)
    {
        if (project.Dependencies.Count == 0) return 0;

        int outdatedWeight = project.Dependencies.Sum(d => d.Status switch
        {
            DependencyStatus.MajorUpdate => MajorUpdateWeight,
            DependencyStatus.MinorUpdate => MinorUpdateWeight,
            _ => 0
        });

        double maxWeight = project.Dependencies.Count * MajorUpdateWeight;

        return (int)Math.Round(outdatedWeight / maxWeight * MaxOutdatedPenalty);
    }

    public static int CalculateHealthScore(Project project)
    {
        int penalty = OutdatedPenalty(project);

        foreach (Dependency dep in project.Dependencies)
        {
            if (dep.Status == DependencyStatus.EOL) penalty += EolDependencyPenalty;

            penalty += dep.Vulnerabilities.Sum(v => SeverityPenalty(v.Severity));
        }

        penalty += project.Runtimes.Count(r => r.IsEol) * EolRuntimePenalty;

        return (int)Math.Round(MaxScore * Math.Exp(-penalty / (double)ScoreDecayConstant));
    }

    private static string ScoreToGrade(int score) => score switch
    {
        >= 90 => "A",
        >= 75 => "B",
        >= 60 => "C",
        >= 45 => "D",
        >= 30 => "E",
        _ => "F"
    };

    public async Task<ProjectDto?> GetProjectWithDetailsAsync(Guid projectId)
    {
        Project? project = await _projectRepository
            .GetOrDefaultWithHealthDetailsAsync(projectId, QueryTracking.NoTracking, CancellationToken.None);

        return project == null ? null : MapToDto(project);
    }

    public static ProjectDto MapToDto(Project project)
    {
        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            RepositoryUrl = project.RepositoryUrl,
            RepositoryType = project.RepositoryType.ToString(),
            LastScanAt = project.LastScanAt,
            LastScanError = project.LastScanError,
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
            Coverage = project.Coverage.ToString(),
            ScanFrequency = project.ScanFrequency.ToString(),
            TotalDependencies = project.Dependencies?.Count ?? 0,
            VulnerableDependencies = project.Dependencies?.Count(d => d.Status == DependencyStatus.Vulnerable) ?? 0,
            CriticalVulnerabilities = project.Dependencies?
                .SelectMany(d => d.Vulnerabilities)
                .Count(v => v.Severity == VulnerabilitySeverity.Critical) ?? 0,
            TotalVulnerabilities = project.Dependencies?
                .SelectMany(d => d.Vulnerabilities)
                .Count() ?? 0,
            Dependencies = project.Dependencies?.Select(d => new DependencyDto
            {
                Id = d.Id,
                Name = d.Name,
                CurrentVersion = d.CurrentVersion,
                LatestVersion = d.LatestVersion,
                Type = d.Type.ToString(),
                Ecosystem = d.Ecosystem.ToString(),
                Status = d.Status.ToString(),
                ScannedAt = d.ScannedAt,
                Vulnerabilities = d.Vulnerabilities.Select(v => new VulnerabilityDto
                {
                    Id = v.Id,
                    CveId = v.CveId,
                    CvssScore = v.CvssScore,
                    Description = v.Description,
                    Severity = v.Severity.ToString(),
                    FixedVersion = v.FixedVersion,
                    AdvisoryUrl = v.AdvisoryUrl,
                    DetectedAt = v.DetectedAt
                }).ToList()
            }).ToList() ?? new List<DependencyDto>(),
            Runtimes = project.Runtimes?.Select(r => new RuntimeDto
            {
                Id = r.Id,
                Name = r.Name,
                Version = r.Version,
                EolDate = r.EolDate,
                IsEol = r.IsEol
            }).ToList() ?? new List<RuntimeDto>()
        };
    }
}
