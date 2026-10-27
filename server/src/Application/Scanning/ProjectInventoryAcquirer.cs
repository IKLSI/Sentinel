using Microsoft.Extensions.Logging;
using Sentinel.Application.Projects;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Scanning;

public sealed record InventoryAcquisition(
    bool ScanRan,
    string? ScanError,
    int ManifestsRead,
    bool RepositoryUnchanged,
    bool InventoryReplaced,
    InventoryGap? Gap,
    bool KeepExistingInventory,
    string? ScannedCommitSha)
{
    public static readonly InventoryAcquisition NotScanned = new(false, null, 0, false, false, null, false, null);

    public bool InventoryComplete => Gap == null;

    public bool ReusesExistingInventory => RepositoryUnchanged || KeepExistingInventory;
}

public class ProjectInventoryAcquirer(
    RepositoryScannerService repositoryScanner,
    ProjectInventoryWriter inventoryWriter,
    IOrganizationRepository organizationRepository,
    TokenProtector tokenProtector,
    ILogger<ProjectInventoryAcquirer> logger)
{
    public async Task<InventoryAcquisition> AcquireAsync(Project project, CancellationToken cancellationToken,
        IProgress<ScanStage>? progress = null)
    {
        if (string.IsNullOrEmpty(project.RepositoryUrl)) return InventoryAcquisition.NotScanned;

        Organization? organization = await organizationRepository.GetOrDefaultAsync(project.OrganizationId,
            QueryTracking.NoTracking, cancellationToken);

        RepositoryAccess repositoryAccess = RepositoryAccessFactory.For(project, organization, tokenProtector);
        string? headCommitSha = await repositoryScanner.GetHeadCommitAsync(project.RepositoryUrl, repositoryAccess,
            project.Branch, cancellationToken);

        bool repositoryUnchanged = headCommitSha != null
            && headCommitSha == project.LastScannedCommitSha
            && project.Coverage == ScanCoverage.Covered;

        if (repositoryUnchanged)
        {
            logger.LogInformation("Project {ProjectId}: repository unchanged at {Sha}, manifests not re-read",
                project.Id, headCommitSha);

            return new InventoryAcquisition(true, null, 0, true, false, null, false, null);
        }

        ScanOutcome outcome = await repositoryScanner.ScanRepositoryAsync(project.Id, project.RepositoryUrl,
            repositoryAccess, headCommitSha, new RepositoryScanScope(project.Branch, project.RootPath),
            cancellationToken, progress);

        bool keepExistingInventory = !outcome.IsComplete && project.Coverage == ScanCoverage.Covered;

        if (keepExistingInventory)
        {
            logger.LogWarning("Scan of {Url}: inventory incomplete, existing data kept", project.RepositoryUrl);
        }
        else if (outcome.Dependencies.Count > 0 || outcome.Runtimes.Count > 0)
        {
            await inventoryWriter.ReconcileInventoryAsync(project, outcome.Dependencies, outcome.Runtimes,
                cancellationToken);

            return new InventoryAcquisition(true, outcome.Error, outcome.ManifestsRead, false, true,
                outcome.Gap, false, outcome.IsComplete ? headCommitSha : null);
        }
        else if (outcome.Error != null)
        {
            logger.LogWarning("Scan of {Url} failed: {Error} — existing data kept", project.RepositoryUrl,
                outcome.Error);
        }
        else
        {
            logger.LogWarning("Scan of {Url}: no data returned, existing data kept", project.RepositoryUrl);
        }

        return new InventoryAcquisition(true, outcome.Error, outcome.ManifestsRead, false, false,
            outcome.Gap, keepExistingInventory, null);
    }
}
