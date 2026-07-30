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

    public async Task<ProjectDto?> GetProjectWithDetailsAsync(Guid projectId)
    {
        Project? project = await _projectRepository
            .GetOrDefaultWithHealthDetailsAsync(projectId, QueryTracking.NoTracking, CancellationToken.None);

        return project == null ? null : MapToDto(project);
    }

}
