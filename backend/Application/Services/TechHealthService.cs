using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class TechHealthService
{
    private readonly SentinelContext _context;
    private readonly HttpClient _osvClient;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TechHealthService> _logger;
    private readonly RepositoryScannerService _repositoryScanner;
    private readonly TokenProtector _tokenProtector;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;

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
    };

    public TechHealthService(
        SentinelContext context,
        IHttpClientFactory httpClientFactory,
        ILogger<TechHealthService> logger,
        RepositoryScannerService repositoryScanner,
        TokenProtector tokenProtector,
        IServiceScopeFactory scopeFactory,
        IBackgroundJobClient backgroundJobs,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _osvClient = httpClientFactory.CreateClient("OSV");
        _logger = logger;
        _repositoryScanner = repositoryScanner;
        _tokenProtector = tokenProtector;
        _scopeFactory = scopeFactory;
        _backgroundJobs = backgroundJobs;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
    }

    public async Task ScanProjectAsync(Guid projectId)
    {
        using IDisposable elevation = _systemScope.Enter();

        TechProject? project = await _context.TechProjects
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null) return;

        bool isFirstScan = project.LastScanAt == null;

        HashSet<string> previousCveIds = await _context.Vulnerabilities
            .Where(v => v.Dependency.TechProjectId == projectId)
            .Select(v => v.CveId)
            .ToHashSetAsync();

        string? scanError = null;

        if (!string.IsNullOrEmpty(project.RepositoryUrl))
        {
            string? tokenOverride = null;
            Organization? org = await _context.Organizations.FindAsync(project.OrganizationId);
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

            if (outcome.Dependencies.Count > 0 || outcome.Runtimes.Count > 0)
            {
                IExecutionStrategy strategy = _context.Database.CreateExecutionStrategy();
                await strategy.ExecuteAsync(async () =>
                {
                    await using IDbContextTransaction tx = await _context.Database.BeginTransactionAsync();

                    await _context.Vulnerabilities
                        .Where(v => v.Dependency.TechProjectId == projectId)
                        .ExecuteDeleteAsync();
                    await _context.Dependencies
                        .Where(d => d.TechProjectId == projectId)
                        .ExecuteDeleteAsync();
                    await _context.Runtimes
                        .Where(r => r.TechProjectId == projectId)
                        .ExecuteDeleteAsync();
                    await _context.Dependencies.AddRangeAsync(outcome.Dependencies);
                    await _context.Runtimes.AddRangeAsync(outcome.Runtimes);
                    await _context.SaveChangesAsync();

                    await tx.CommitAsync();
                });
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
            project = await _context.TechProjects
                .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
                .Include(p => p.Runtimes)
                .FirstAsync(p => p.Id == projectId);
        }

        using SemaphoreSlim throttle = new SemaphoreSlim(10);

        async Task RunThrottledAsync(Func<Task> work)
        {
            await throttle.WaitAsync();
            try { await work(); }
            finally { throttle.Release(); }
        }

        await Task.WhenAll(project.Dependencies.Select(d =>
            RunThrottledAsync(() => CheckVulnerabilitiesAsync(d))));

        await Task.WhenAll(project.Runtimes.Select(r =>
            RunThrottledAsync(() => CheckRuntimeEolAsync(r))));

        project.HealthScore = CalculateHealthScore(project);
        project.HealthGrade = ScoreToGrade(project.HealthScore);
        project.LastScanAt = DateTime.UtcNow;
        project.LastScanError = scanError;

        foreach (Dependency dep in project.Dependencies)
            dep.ScannedAt = DateTime.UtcNow;

        Organization? scanOrg = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == project.OrganizationId);
        if (scanOrg != null)
        {
            QuotaService.ResetScanPeriodIfElapsed(scanOrg);
            scanOrg.MonthlyScanCount++;
        }

        await _context.SaveChangesAsync();

        await TrySendVulnerabilityAlertAsync(project, isFirstScan, previousCveIds);
    }

    private async Task TrySendVulnerabilityAlertAsync(TechProject project, bool isFirstScan, HashSet<string> previousCveIds)
    {
        try
        {
            List<Vulnerability> allVulns = project.Dependencies
                .SelectMany(d => d.Vulnerabilities)
                .ToList();

            List<Vulnerability> newVulns = isFirstScan
                ? allVulns
                : allVulns.Where(v => !previousCveIds.Contains(v.CveId)).ToList();

            if (newVulns.Count == 0) return;

            List<string> adminEmails = await _context.Users
                .Where(u => u.OrganizationId == project.OrganizationId && u.Role == UserRole.Admin)
                .Select(u => u.Email)
                .ToListAsync();

            if (adminEmails.Count == 0) return;

            Organization? org = await _context.Organizations.FindAsync(project.OrganizationId);
            string organizationName = org?.Name ?? string.Empty;
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
        List<Guid> daily = await _context.TechProjects
            .Where(p => p.ScanFrequency == ScanFrequency.Daily
                && (p.LastScanAt == null || p.LastScanAt < DateTime.UtcNow.AddDays(-1)))
            .Select(p => p.Id)
            .ToListAsync();

        List<Guid> weekly = await _context.TechProjects
            .Where(p => p.ScanFrequency == ScanFrequency.Weekly
                && (p.LastScanAt == null || p.LastScanAt < DateTime.UtcNow.AddDays(-7)))
            .Select(p => p.Id)
            .ToListAsync();

        using SemaphoreSlim throttle = new SemaphoreSlim(5);
        await Task.WhenAll(daily.Concat(weekly).Select(async projectId =>
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

    private async Task CheckVulnerabilitiesAsync(Dependency dependency)
    {
        if (!OsvEcosystemMap.TryGetValue(dependency.Ecosystem, out string? ecosystem)) return;

        try
        {
            var requestBody = new
            {
                version = dependency.CurrentVersion,
                package = new { name = dependency.Name, ecosystem }
            };

            HttpResponseMessage response = await _osvClient.PostAsJsonAsync("https://api.osv.dev/v1/query", requestBody);
            if (!response.IsSuccessStatusCode) return;

            using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

            if (!doc.RootElement.TryGetProperty("vulns", out JsonElement vulns))
            {
                dependency.Status = DependencyStatus.UpToDate;
                return;
            }

            HashSet<string> existingCves = dependency.Vulnerabilities.Select(v => v.CveId).ToHashSet();
            List<Vulnerability> newVulns = new();

            foreach (JsonElement vuln in vulns.EnumerateArray())
            {
                string id = vuln.TryGetProperty("id", out JsonElement idProp)
                    ? idProp.GetString() ?? string.Empty
                    : string.Empty;

                if (existingCves.Contains(id)) continue;

                (decimal cvss, VulnerabilitySeverity severity) = ExtractSeverity(vuln);
                string? fixedVersion = ExtractFixedVersion(vuln, dependency.Name);
                string? advisoryUrl = ExtractAdvisoryUrl(vuln, id);
                string summary = vuln.TryGetProperty("summary", out JsonElement sumProp)
                    ? sumProp.GetString() ?? string.Empty
                    : string.Empty;

                newVulns.Add(new Vulnerability
                {
                    DependencyId = dependency.Id,
                    CveId = id,
                    CvssScore = cvss,
                    Description = summary,
                    PackageName = dependency.Name,
                    AffectedVersion = dependency.CurrentVersion,
                    FixedVersion = fixedVersion,
                    AdvisoryUrl = advisoryUrl,
                    Severity = severity,
                    DetectedAt = DateTime.UtcNow
                });
            }

            if (newVulns.Count > 0)
            {
                foreach (Vulnerability v in newVulns) dependency.Vulnerabilities.Add(v);
                dependency.Status = DependencyStatus.Vulnerable;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur CVE pour {Dependency}", dependency.Name);
        }
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

    private async Task CheckRuntimeEolAsync(Runtime runtime)
    {
        if (!EolProductMap.TryGetValue(runtime.Name, out string? product)) return;

        string[] parts = runtime.Version.Split('.');
        if (parts.Length == 0 || parts[0] == "unknown") return;

        string cycle = runtime.Name.ToLowerInvariant() switch
        {
            "node.js" or "nodejs" => parts[0],
            ".net" or "dotnet" => parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : parts[0],
            _ => parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : parts[0]
        };

        try
        {
            HttpClient eolClient = _httpClientFactory.CreateClient("EolDate");
            HttpResponseMessage response = await eolClient.GetAsync($"https://endoflife.date/api/{product}/{cycle}.json");
            if (!response.IsSuccessStatusCode) return;

            using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty("eol", out JsonElement eolProp)) return;

            if (eolProp.ValueKind == JsonValueKind.True)
            {
                runtime.IsEol = true;
            }
            else if (eolProp.ValueKind == JsonValueKind.False)
            {
                runtime.IsEol = false;
            }
            else if (eolProp.ValueKind == JsonValueKind.String &&
                     DateTime.TryParse(eolProp.GetString(), out DateTime eolDate))
            {
                eolDate = DateTime.SpecifyKind(eolDate, DateTimeKind.Utc);
                runtime.EolDate = eolDate;
                runtime.IsEol = eolDate < DateTime.UtcNow;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "EOL check non disponible pour {Runtime} {Version}", runtime.Name, runtime.Version);
        }
    }

    private static int CalculateHealthScore(TechProject project)
    {
        int score = 100;

        foreach (Dependency dep in project.Dependencies)
        {
            score -= dep.Status switch
            {
                DependencyStatus.MajorUpdate => 2,
                DependencyStatus.MinorUpdate => 1,
                DependencyStatus.EOL => 10,
                _ => 0
            };

            foreach (Vulnerability vuln in dep.Vulnerabilities)
            {
                score -= vuln.Severity switch
                {
                    VulnerabilitySeverity.Critical => 15,
                    VulnerabilitySeverity.High => 10,
                    VulnerabilitySeverity.Medium => 5,
                    VulnerabilitySeverity.Low => 2,
                    _ => 0
                };
            }
        }

        foreach (Runtime rt in project.Runtimes)
        {
            if (rt.IsEol) score -= 15;
        }

        return Math.Max(0, Math.Min(100, score));
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

    public async Task<TechProjectDto?> GetProjectWithDetailsAsync(Guid projectId)
    {
        TechProject? project = await _context.TechProjects
            .AsNoTracking()
            .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
            .Include(p => p.Runtimes)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        return project == null ? null : MapToDto(project);
    }

    public static TechProjectDto MapToDto(TechProject project)
    {
        return new TechProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            RepositoryUrl = project.RepositoryUrl,
            RepositoryType = project.RepositoryType.ToString(),
            LastScanAt = project.LastScanAt,
            LastScanError = project.LastScanError,
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
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
