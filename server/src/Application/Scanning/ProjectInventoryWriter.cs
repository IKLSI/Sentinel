using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Scanning;

public class ProjectInventoryWriter(
    IDependencyRepository dependencyRepository,
    IVulnerabilityRepository vulnerabilityRepository,
    IRuntimeRepository runtimeRepository,
    ICommitScopeFactory commitScopeFactory)
{
    public async Task ReconcileInventoryAsync(Project project, IReadOnlyList<Dependency> dependencies,
        IReadOnlyList<Runtime> runtimes, CancellationToken cancellationToken)
    {
        Guid projectId = project.Id;

        foreach (Dependency dependency in dependencies) dependency.OrganizationId = project.OrganizationId;
        foreach (Runtime runtime in runtimes) runtime.OrganizationId = project.OrganizationId;

        InventoryCarryOver.ApplyPackageMetadata(dependencies,
            await dependencyRepository.ListPackageMetadataByProjectAsync(projectId, cancellationToken));
        InventoryCarryOver.ApplyRuntimeLifecycle(runtimes,
            await runtimeRepository.ListLifecycleByProjectAsync(projectId, cancellationToken));

        await commitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            InventoryChanges<Dependency> dependencyChanges = InventoryReconciliation.ReconcileDependencies(
                await dependencyRepository.ListTrackedByProjectAsync(projectId, token), dependencies);
            InventoryChanges<Runtime> runtimeChanges = InventoryReconciliation.ReconcileRuntimes(
                await runtimeRepository.ListTrackedByProjectAsync(projectId, token), runtimes);

            await dependencyRepository.DeleteByIdsAsync(dependencyChanges.RemovedIds, token);
            await runtimeRepository.DeleteByIdsAsync(runtimeChanges.RemovedIds, token);
            await dependencyRepository.AddRangeAsync(dependencyChanges.Added, token);
            await runtimeRepository.AddRangeAsync(runtimeChanges.Added, token);
        }, cancellationToken);
    }

    public async Task StageVulnerabilityChangesAsync(IReadOnlyList<VulnerabilityScanResult> results,
        CancellationToken cancellationToken)
    {
        foreach (VulnerabilityScanResult result in results)
        {
            if (result.Status is { } status) result.Dependency.Status = status;

            foreach (Vulnerability resolved in result.ResolvedVulnerabilities)
            {
                result.Dependency.Vulnerabilities.Remove(resolved);
                vulnerabilityRepository.Remove(resolved);
            }

            foreach (Vulnerability added in result.NewVulnerabilities)
            {
                result.Dependency.Vulnerabilities.Add(added);
                await vulnerabilityRepository.AddAsync(added, cancellationToken);
            }
        }
    }

    public static void StageRuntimeChanges(IReadOnlyList<RuntimeEolResult> results)
    {
        foreach (RuntimeEolResult result in results)
        {
            if (result.IsEol is { } isEol) result.Runtime.IsEol = isEol;
            if (result.EolDate is { } eolDate) result.Runtime.EolDate = eolDate;
        }
    }

    public async Task SaveAsync(CancellationToken cancellationToken)
    {
        using ICommitScope commitScope = commitScopeFactory.Begin();

        await commitScope.CommitAsync(cancellationToken);
    }
}
