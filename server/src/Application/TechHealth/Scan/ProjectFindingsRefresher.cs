using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Scan;

public class ProjectFindingsRefresher(
    RepositoryScannerService repositoryScanner,
    VulnerabilityScanService vulnerabilityScanner,
    RuntimeEolScanService runtimeEolScanner,
    ExploitSignalEnricher exploitSignalEnricher,
    ProjectInventoryWriter inventoryWriter)
{
    public async Task<bool> RefreshAsync(Project project, InventoryAcquisition acquisition,
        IReadOnlyDictionary<string, DateTime> previousDetections, CancellationToken cancellationToken)
    {
        if (acquisition.ReusesExistingInventory)
            await repositoryScanner.RefreshVersionsAsync(project.Dependencies.ToList(), cancellationToken);
        else if (acquisition.InventoryReplaced)
            project.LastScannedCommitSha = acquisition.ScannedCommitSha;

        Task<VulnerabilityScanOutcome> vulnerabilityScan = vulnerabilityScanner
            .ScanAsync(project.Dependencies.ToList(), previousDetections, cancellationToken);
        Task<IReadOnlyList<RuntimeEolResult>> runtimeScan =
            runtimeEolScanner.ScanAsync(project.Runtimes.ToList(), cancellationToken);

        await Task.WhenAll(vulnerabilityScan, runtimeScan);

        VulnerabilityScanOutcome vulnerabilityOutcome = await vulnerabilityScan;

        await inventoryWriter.StageVulnerabilityChangesAsync(vulnerabilityOutcome.Results, cancellationToken);
        ProjectInventoryWriter.StageRuntimeChanges(await runtimeScan);
        await exploitSignalEnricher.EnrichAsync(project.Dependencies.ToList(), cancellationToken);

        return vulnerabilityOutcome.IsComplete;
    }
}
