using Hangfire;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Audit;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
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
    ExploitSignalEnricher exploitSignalEnricher,
    VulnerabilityAlertService vulnerabilityAlerts,
    FindingTicketSyncService findingTicketSync,
    CriticalVulnerabilityTicketService criticalVulnerabilityTickets,
    ProjectInventoryWriter inventoryWriter,
    TokenProtector tokenProtector,
    DashboardCache dashboardCache,
    IRealtimeNotifier realtimeNotifier,
    ISystemScope systemScope,
    IDatabaseConnectionHolder connectionHolder,
    IAuditLogService auditLog,
    ILogger<ProjectScanService> logger)
{
    [AutomaticRetry(Attempts = 0)]
    public async Task ScanProjectAsync(Guid projectId)
    {
        using IDisposable elevation = systemScope.Enter();
        await using IAsyncDisposable connection = await connectionHolder.HoldOpenAsync(CancellationToken.None);

        Project? project = await projectRepository.GetOrDefaultAsync(projectId,
            QueryTracking.Tracked, CancellationToken.None);

        if (project == null) return;

        try
        {
            await RunScanAsync(project);
        }
        catch
        {
            await MarkScanFailedAsync(projectId);
            await NotifyProjectChangedAsync(project.OrganizationId, projectId);
            throw;
        }
    }

    private async Task RunScanAsync(Project project)
    {
        Guid projectId = project.Id;

        bool isFirstScan = project.LastScanAt == null;

        Dictionary<string, DateTime> previousDetections =
            await vulnerabilityRepository.GetFirstDetectionsByProjectAsync(projectId, CancellationToken.None);

        HashSet<string> previousCveIds = previousDetections.Keys.ToHashSet();

        string? scanError = null;
        int manifestsRead = 0;
        bool scanRan = false;
        bool repositoryUnchanged = false;
        bool inventoryReplaced = false;
        string? scannedCommitSha = null;

        if (!string.IsNullOrEmpty(project.RepositoryUrl))
        {
            scanRan = true;

            RepositoryAccess repositoryAccess = await ResolveRepositoryAccessAsync(project);
            string? headCommitSha = await repositoryScanner.GetHeadCommitAsync(project.RepositoryUrl, repositoryAccess);

            repositoryUnchanged = headCommitSha != null
                && headCommitSha == project.LastScannedCommitSha
                && project.Coverage == ScanCoverage.Covered;

            if (repositoryUnchanged)
            {
                logger.LogInformation("Project {ProjectId}: repository unchanged at {Sha}, manifests not re-read",
                    projectId, headCommitSha);
            }
            else
            {
                ScanOutcome outcome = await repositoryScanner.ScanRepositoryAsync(projectId, project.RepositoryUrl,
                    repositoryAccess, headCommitSha);

                scanError = outcome.Error;
                manifestsRead = outcome.ManifestsRead;

                if (outcome.Dependencies.Count > 0 || outcome.Runtimes.Count > 0)
                {
                    await inventoryWriter.ReplaceInventoryAsync(projectId, outcome.Dependencies, outcome.Runtimes,
                        CancellationToken.None);

                    scannedCommitSha = headCommitSha;
                    inventoryReplaced = true;
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
        }

        Project? reloadedProject = await projectRepository
            .GetOrDefaultWithHealthDetailsAsync(projectId, QueryTracking.Tracked, CancellationToken.None);

        if (reloadedProject == null) return;

        project = reloadedProject;

        if (repositoryUnchanged)
        {
            await repositoryScanner.RefreshVersionsAsync(project.Dependencies.ToList());
        }
        else if (inventoryReplaced)
        {
            project.LastScannedCommitSha = scannedCommitSha;
        }

        VulnerabilityScanOutcome vulnerabilityOutcome = await vulnerabilityScanner
            .ScanAsync(project.Dependencies.ToList(), previousDetections);

        IReadOnlyList<RuntimeEolResult> runtimeResults = await runtimeEolScanner.ScanAsync(project.Runtimes.ToList());

        await inventoryWriter.StageVulnerabilityChangesAsync(vulnerabilityOutcome.Results, CancellationToken.None);
        ProjectInventoryWriter.StageRuntimeChanges(runtimeResults);
        await exploitSignalEnricher.EnrichAsync(project.Dependencies.ToList());

        project.Coverage = ScanCoverageResolver.Resolve(project, scanRan, scanError, manifestsRead);
        project.HealthScore = project.Coverage == ScanCoverage.Covered ? HealthScoreCalculator.Calculate(project) : null;
        project.HealthGrade = project.HealthScore is { } score ? HealthScoreCalculator.ToGrade(score) : null;
        project.LastScanAt = DateTime.UtcNow;
        project.LastScanError = scanError
            ?? (vulnerabilityOutcome.IsComplete ? null : ErrorCodes.ScanVulnerabilityDataIncomplete);

        if (!vulnerabilityOutcome.IsComplete)
            logger.LogWarning("Project {ProjectId}: vulnerability data incomplete for this scan", projectId);

        await inventoryWriter.SaveAsync(CancellationToken.None);

        bool ticketsChanged = false;

        if (project.Coverage == ScanCoverage.Covered && vulnerabilityOutcome.IsComplete)
        {
            FindingTicketSyncResult? sync = await findingTicketSync.SyncAsync(project);
            bool ticketsCreated = await criticalVulnerabilityTickets.CreateMissingAsync(project, sync?.LinkedTickets);
            ticketsChanged = sync?.TicketsChanged == true || ticketsCreated;
        }

        await auditLog.LogAsync(
            AuditAction.ScanCompleted,
            entityType: AuditEntityTypes.Project,
            organizationId: project.OrganizationId,
            userId: null,
            entityId: project.Id);

        dashboardCache.Invalidate(project.OrganizationId);

        if (ticketsChanged)
            await realtimeNotifier.NotifyOrganizationAsync(project.OrganizationId,
                new RealtimeEvent(RealtimeResources.Tickets));

        await NotifyProjectChangedAsync(project.OrganizationId, projectId);
        await vulnerabilityAlerts.TrySendAsync(project, isFirstScan, previousCveIds);
    }

    private async Task<RepositoryAccess> ResolveRepositoryAccessAsync(Project project)
    {
        Organization? organization = await organizationRepository.GetOrDefaultAsync(project.OrganizationId,
            QueryTracking.NoTracking, CancellationToken.None);

        if (organization == null) return RepositoryAccess.Anonymous;

        string? stored = project.RepositoryType == RepositoryType.GitLab
            ? organization.GitlabToken
            : organization.GithubToken;

        return new RepositoryAccess(tokenProtector.Unprotect(stored), organization.ToGitLabInstance());
    }

    private async Task MarkScanFailedAsync(Guid projectId)
    {
        try
        {
            await projectRepository.MarkScanFailedAsync(projectId, ErrorCodes.ScanFailed, DateTime.UtcNow,
                CancellationToken.None);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Unable to record the scan failure of project {ProjectId}", projectId);
        }
    }

    private Task NotifyProjectChangedAsync(Guid organizationId, Guid projectId) =>
        realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Project, projectId));
}
