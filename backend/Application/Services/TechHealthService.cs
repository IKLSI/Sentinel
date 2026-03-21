using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Text.Json;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class TechHealthService
{
    private readonly SentinelContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<TechHealthService> _logger;
    private readonly RepositoryScannerService _repositoryScanner;

    public TechHealthService(SentinelContext context, IHttpClientFactory httpClientFactory, ILogger<TechHealthService> logger, RepositoryScannerService repositoryScanner)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient("OSV");
        _logger = logger;
        _repositoryScanner = repositoryScanner;
    }

    public async Task ScanProjectAsync(Guid projectId)
    {
        TechProject? project = await _context.TechProjects
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
        {
            return;
        }

        if (!string.IsNullOrEmpty(project.RepositoryUrl))
        {
            await _context.Vulnerabilities
                .Where(v => v.Dependency.TechProjectId == projectId)
                .ExecuteDeleteAsync();
            await _context.Dependencies
                .Where(d => d.TechProjectId == projectId)
                .ExecuteDeleteAsync();
            await _context.Runtimes
                .Where(r => r.TechProjectId == projectId)
                .ExecuteDeleteAsync();

            (List<Dependency>? newDeps, List<Runtime>? newRuntimes) = await _repositoryScanner.ScanRepositoryAsync(project.Id, project.RepositoryUrl);
            await _context.Dependencies.AddRangeAsync(newDeps);
            await _context.Runtimes.AddRangeAsync(newRuntimes);
            await _context.SaveChangesAsync();
        }

        project = await _context.TechProjects
            .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
            .Include(p => p.Runtimes)
            .FirstAsync(p => p.Id == projectId);

        foreach (Dependency dependency in project.Dependencies)
        {
            await CheckVulnerabilitiesAsync(dependency);
        }

        project.HealthScore = CalculateHealthScore(project);
        project.HealthGrade = ScoreToGrade(project.HealthScore);
        project.LastScanAt = DateTime.UtcNow;

        foreach (Dependency dep in project.Dependencies)
        {
            dep.ScannedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
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

        List<Guid> allDue = daily.Concat(weekly).ToList();

        foreach (Guid projectId in allDue)
        {
            try
            {
                await ScanProjectAsync(projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du scan du projet {ProjectId}", projectId);
            }
        }
    }

    private async Task CheckVulnerabilitiesAsync(Dependency dependency)
    {
        try
        {
            string ecosystem = dependency.Ecosystem.ToString();
            var requestBody = new
            {
                version = dependency.CurrentVersion,
                package = new
                {
                    name = dependency.Name,
                    ecosystem
                }
            };

            HttpResponseMessage response = await _httpClient.PostAsJsonAsync("https://api.osv.dev/v1/query", requestBody);
            if (!response.IsSuccessStatusCode)
            {
                return;
            }

            string content = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(content);

            if (!doc.RootElement.TryGetProperty("vulns", out JsonElement vulns))
            {
                dependency.Status = DependencyStatus.UpToDate;
                return;
            }

            HashSet<string> existingCves = dependency.Vulnerabilities.Select(v => v.CveId).ToHashSet();
            List<Vulnerability> newVulns = new List<Vulnerability>();

            foreach (JsonElement vuln in vulns.EnumerateArray())
            {
                string id = vuln.TryGetProperty("id", out JsonElement idProp) ? idProp.GetString() ?? string.Empty : string.Empty;

                if (existingCves.Contains(id))
                {
                    continue;
                }

                VulnerabilitySeverity severity = VulnerabilitySeverity.Medium;
                decimal cvss = 0;

                if (vuln.TryGetProperty("severity", out JsonElement severityArr))
                {
                    foreach (JsonElement sev in severityArr.EnumerateArray())
                    {
                        if (sev.TryGetProperty("score", out JsonElement scoreProp))
                        {
                            if (decimal.TryParse(scoreProp.GetString(), out decimal parsedScore))
                            {
                                cvss = parsedScore;
                                severity = cvss switch
                                {
                                    >= 9 => VulnerabilitySeverity.Critical,
                                    >= 7 => VulnerabilitySeverity.High,
                                    >= 4 => VulnerabilitySeverity.Medium,
                                    _ => VulnerabilitySeverity.Low
                                };
                            }
                        }
                    }
                }

                string summary = vuln.TryGetProperty("summary", out JsonElement sumProp) ? sumProp.GetString() ?? string.Empty : string.Empty;

                newVulns.Add(new Vulnerability
                {
                    DependencyId = dependency.Id,
                    CveId = id,
                    CvssScore = cvss,
                    Description = summary,
                    PackageName = dependency.Name,
                    AffectedVersion = dependency.CurrentVersion,
                    Severity = severity,
                    DetectedAt = DateTime.UtcNow
                });
            }

            if (newVulns.Count > 0)
            {
                await _context.Vulnerabilities.AddRangeAsync(newVulns);
                dependency.Status = DependencyStatus.Vulnerable;
            }
            else if (dependency.Status != DependencyStatus.EOL)
            {
                dependency.Status = DependencyStatus.UpToDate;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors de la vérification des CVE pour {Dependency}", dependency.Name);
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
                DependencyStatus.Vulnerable => 0,
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

        return Math.Max(0, Math.Min(100, score));
    }

    private static string ScoreToGrade(int score)
    {
        return score switch
        {
            >= 90 => "A",
            >= 75 => "B",
            >= 60 => "C",
            >= 45 => "D",
            >= 30 => "E",
            _ => "F"
        };
    }

    public async Task<TechProjectDto?> GetProjectWithDetailsAsync(Guid projectId)
    {
        TechProject? project = await _context.TechProjects
            .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
            .Include(p => p.Runtimes)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
        {
            return null;
        }

        return MapToDto(project);
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
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
            ScanFrequency = project.ScanFrequency.ToString(),
            TotalDependencies = project.Dependencies?.Count ?? 0,
            VulnerableDependencies = project.Dependencies?.Count(d => d.Status == DependencyStatus.Vulnerable) ?? 0,
            CriticalVulnerabilities = project.Dependencies?.SelectMany(d => d.Vulnerabilities)
                .Count(v => v.Severity == VulnerabilitySeverity.Critical) ?? 0,
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
