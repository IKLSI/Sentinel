using Hangfire;
using Microsoft.Extensions.Logging;
using Sentinel.Application.TechHealth.Suppressions;
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
    IVulnerabilityRepository vulnerabilityRepository,
    ProjectInventoryAcquirer inventoryAcquirer,
    ProjectFindingsRefresher findingsRefresher,
    ProjectInventoryWriter inventoryWriter,
    ProjectHealthHistoryWriter healthHistoryWriter,
    ProjectHealthRecalculator healthRecalculator,
    ScanFollowUpService followUps,
    IRealtimeNotifier realtimeNotifier,
    ISystemScope systemScope,
    IDatabaseConnectionHolder connectionHolder,
    ProjectScanGate scanGate,
    ILogger<ProjectScanService> logger)
{
    [AutomaticRetry(Attempts = 0)]
    public async Task ScanProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (!scanGate.TryStart(projectId))
        {
            logger.LogInformation("Project {ProjectId}: a scan is already running, this one is skipped", projectId);
            return;
        }

        try
        {
            await ScanExclusivelyAsync(projectId, cancellationToken);
        }
        finally
        {
            scanGate.Complete(projectId);
        }
    }

    private async Task ScanExclusivelyAsync(Guid projectId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        Project? project = await projectRepository.GetOrDefaultAsync(projectId,
            QueryTracking.Tracked, cancellationToken);

        if (project == null) return;

        try
        {
            await RunScanAsync(project, cancellationToken);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            await MarkScanFailedAsync(projectId);
            await NotifyProjectChangedAsync(project.OrganizationId, projectId);
            throw;
        }
    }

    private async Task RunScanAsync(Project project, CancellationToken cancellationToken)
    {
        Guid projectId = project.Id;

        bool isFirstScan = project.LastScanAt == null;
        (int? scoreBefore, string? gradeBefore, ScanCoverage coverageBefore, string? errorBefore) =
            (project.HealthScore, project.HealthGrade, project.Coverage, project.LastScanError);

        Dictionary<string, DateTime> previousDetections =
            await vulnerabilityRepository.GetFirstDetectionsByProjectAsync(projectId, cancellationToken);

        InventoryAcquisition acquisition = await inventoryAcquirer.AcquireAsync(project, cancellationToken);

        Project? reloadedProject = await projectRepository
            .GetOrDefaultWithHealthDetailsAsync(projectId, QueryTracking.Tracked, cancellationToken);

        if (reloadedProject == null) return;

        project = reloadedProject;

        bool vulnerabilityDataComplete = await findingsRefresher.RefreshAsync(project, acquisition,
            previousDetections, cancellationToken);

        await using IAsyncDisposable connection = await connectionHolder.HoldOpenAsync(cancellationToken);

        HashSet<Guid> suppressedIds =
            await healthRecalculator.SuppressedVulnerabilityIdsAsync(project, cancellationToken);

        project.Coverage = ScanCoverageResolver.Resolve(project, acquisition.ScanRan, acquisition.ScanError,
            acquisition.ManifestsRead);
        project.HealthScore = project.Coverage == ScanCoverage.Covered
            ? HealthScoreCalculator.Calculate(project, vulnerability => suppressedIds.Contains(vulnerability.Id))
            : null;
        project.HealthGrade = project.HealthScore is { } score ? HealthScoreCalculator.ToGrade(score) : null;

        DateTime scannedAt = DateTime.UtcNow;
        project.LastScanAt = scannedAt;
        project.LastScanError = acquisition.ScanError
            ?? (acquisition.InventoryComplete ? null : ErrorCodes.ScanInventoryIncomplete)
            ?? (vulnerabilityDataComplete ? null : ErrorCodes.ScanVulnerabilityDataIncomplete);

        bool findingsReliable = project.Coverage == ScanCoverage.Covered
            && vulnerabilityDataComplete
            && acquisition.InventoryComplete;

        if (!vulnerabilityDataComplete)
            logger.LogWarning("Project {ProjectId}: vulnerability data incomplete for this scan", projectId);

        await healthHistoryWriter.StageSnapshotAsync(project, scannedAt, cancellationToken);

        if (findingsReliable)
            await healthHistoryWriter.StageResolutionsAsync(project, previousDetections, scannedAt, cancellationToken);

        await inventoryWriter.SaveAsync(cancellationToken);

        bool projectChanged = !acquisition.RepositoryUnchanged
            || acquisition.InventoryReplaced
            || (scoreBefore, gradeBefore, coverageBefore, errorBefore)
                != (project.HealthScore, project.HealthGrade, project.Coverage, project.LastScanError)
            || !previousDetections.Keys.ToHashSet().SetEquals(project.Dependencies
                .SelectMany(dependency => dependency.Vulnerabilities)
                .Select(vulnerability => vulnerability.CveAlias ?? vulnerability.CveId));

        await followUps.RunAsync(project,
            new ScanFindingsContext(findingsReliable, isFirstScan, previousDetections.Keys.ToHashSet(), suppressedIds,
                projectChanged),
            cancellationToken);
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
