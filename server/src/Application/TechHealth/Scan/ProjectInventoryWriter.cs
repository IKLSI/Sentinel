using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.Scan;

public class ProjectInventoryWriter(
    IDependencyRepository dependencyRepository,
    IVulnerabilityRepository vulnerabilityRepository,
    IRuntimeRepository runtimeRepository,
    ICommitScopeFactory commitScopeFactory)
{
    public Task ReplaceInventoryAsync(Guid projectId, IReadOnlyList<Dependency> dependencies,
        IReadOnlyList<Runtime> runtimes, CancellationToken cancellationToken) =>
        commitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            await dependencyRepository.DeleteByProjectAsync(projectId, token);
            await runtimeRepository.DeleteByProjectAsync(projectId, token);
            await dependencyRepository.AddRangeAsync(dependencies, token);
            await runtimeRepository.AddRangeAsync(runtimes, token);
        }, cancellationToken);

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
