using Hangfire;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Scan;

public class ProjectScanService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IVulnerabilityRepository vulnerabilityRepository,
    RepositoryScannerService repositoryScanner,
    VulnerabilityScanService vulnerabilityScanner,
    RuntimeEolScanService runtimeEolScanner,
    VulnerabilityAlertService vulnerabilityAlerts,
    ProjectInventoryWriter inventoryWriter,
    QuotaGuard quotaGuard,
    TokenProtector tokenProtector,
    DashboardCache dashboardCache,
    IRealtimeNotifier realtimeNotifier,
    ISystemScope systemScope,
    ILogger<ProjectScanService> logger)
{
    public async Task ScanProjectAsync(Guid projectId)
    {
        using IDisposable elevation = systemScope.Enter();

        Project? project = await projectRepository.GetOrDefaultAsync(projectId,
            QueryTracking.Tracked, CancellationToken.None);

        if (project == null) return;

        Result quotaResult = await quotaGuard.TryConsumeScanAsync(project.OrganizationId, CancellationToken.None);

        if (!quotaResult.IsSuccess)
        {
            logger.LogWarning("Project {ProjectId} scan skipped: monthly scan quota reached", projectId);
            return;
        }

        await RunScanAsync(project);
    }

    [AutomaticRetry(Attempts = 0)]
    public async Task ScanProjectWithReservedQuotaAsync(Guid projectId, Guid organizationId)
    {
        using IDisposable elevation = systemScope.Enter();

        try
        {
            Project? project = await projectRepository.GetOrDefaultAsync(projectId,
                QueryTracking.Tracked, CancellationToken.None);

            if (project == null)
            {
                await quotaGuard.RefundScanAsync(organizationId, CancellationToken.None);
                await NotifyProjectChangedAsync(organizationId, projectId);
                return;
            }

            await RunScanAsync(project);
        }
        catch
        {
            await quotaGuard.RefundScanAsync(organizationId, CancellationToken.None);
            await NotifyProjectChangedAsync(organizationId, projectId);
            throw;
        }
    }

    private async Task RunScanAsync(Project project)
    {
        Guid projectId = project.Id;

        bool isFirstScan = project.LastScanAt == null;

        HashSet<string> previousCveIds =
            await vulnerabilityRepository.GetCveIdsByProjectAsync(projectId, CancellationToken.None);

        Dictionary<string, DateTime> previousDetections =
            await vulnerabilityRepository.GetFirstDetectionsByProjectAsync(projectId, CancellationToken.None);

        string? scanError = null;
        int manifestsRead = 0;
        bool scanRan = false;

        if (!string.IsNullOrEmpty(project.RepositoryUrl))
        {
            scanRan = true;

            ScanOutcome outcome = await repositoryScanner.ScanRepositoryAsync(projectId, project.RepositoryUrl,
                await ResolveRepositoryTokenAsync(project));

            scanError = outcome.Error;
            manifestsRead = outcome.ManifestsRead;

            if (outcome.Dependencies.Count > 0 || outcome.Runtimes.Count > 0)
            {
                await inventoryWriter.ReplaceInventoryAsync(projectId, outcome.Dependencies, outcome.Runtimes,
                    CancellationToken.None);
            }
            else if (scanError != null)
            {
                logger.LogWarning("Scan of {Url} failed: {Error} — existing data kept", project.RepositoryUrl, scanError);
            }
            else
            {
                logger.LogWarning("Scan of {Url}: no data returned, existing data kept", project.RepositoryUrl);
            }
        }

        Project? reloadedProject = await projectRepository
            .GetOrDefaultWithHealthDetailsAsync(projectId, QueryTracking.Tracked, CancellationToken.None);

        if (reloadedProject == null) return;

        project = reloadedProject;

        List<VulnerabilityScanResult> vulnerabilityResults = await vulnerabilityScanner
            .ScanAsync(project.Dependencies.ToList(), previousDetections);

        IReadOnlyList<RuntimeEolResult> runtimeResults = await runtimeEolScanner.ScanAsync(project.Runtimes.ToList());

        await inventoryWriter.StageVulnerabilityChangesAsync(vulnerabilityResults, CancellationToken.None);
        ProjectInventoryWriter.StageRuntimeChanges(runtimeResults);

        project.Coverage = ScanCoverageResolver.Resolve(project, scanRan, scanError, manifestsRead);
        project.HealthScore = project.Coverage == ScanCoverage.Covered ? HealthScoreCalculator.Calculate(project) : null;
        project.HealthGrade = project.HealthScore is { } score ? HealthScoreCalculator.ToGrade(score) : null;
        project.LastScanAt = DateTime.UtcNow;
        project.LastScanError = scanError;

        await inventoryWriter.SaveAsync(CancellationToken.None);

        dashboardCache.Invalidate(project.OrganizationId);

        await NotifyProjectChangedAsync(project.OrganizationId, projectId);
        await vulnerabilityAlerts.TrySendAsync(project, isFirstScan, previousCveIds);
    }

    private async Task<string?> ResolveRepositoryTokenAsync(Project project)
    {
        Organization? organization = await organizationRepository.GetOrDefaultAsync(project.OrganizationId,
            QueryTracking.Tracked, CancellationToken.None);

        if (organization == null) return null;

        string? stored = project.RepositoryType == RepositoryType.GitLab
            ? organization.GitlabToken
            : organization.GithubToken;

        return tokenProtector.Unprotect(stored);
    }

    private Task NotifyProjectChangedAsync(Guid organizationId, Guid projectId) =>
        realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Project, projectId), CancellationToken.None);
}
