using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public sealed record InventoryChanges<TEntity>(IReadOnlyList<TEntity> Added, IReadOnlyList<Guid> RemovedIds);

public static class InventoryReconciliation
{
    public static InventoryChanges<Dependency> ReconcileDependencies(IReadOnlyList<Dependency> existing,
        IReadOnlyList<Dependency> scanned) =>
        Reconcile(existing, scanned, DependencyKey, ApplyScannedDependency);

    public static InventoryChanges<Runtime> ReconcileRuntimes(IReadOnlyList<Runtime> existing,
        IReadOnlyList<Runtime> scanned) =>
        Reconcile(existing, scanned, RuntimeKey, ApplyScannedRuntime);

    private static InventoryChanges<TEntity> Reconcile<TEntity, TKey>(IReadOnlyList<TEntity> existing,
        IReadOnlyList<TEntity> scanned, Func<TEntity, TKey> keyOf, Action<TEntity, TEntity> apply)
        where TEntity : IEntityWithId
        where TKey : notnull
    {
        Dictionary<TKey, Queue<TEntity>> unmatched = existing
            .GroupBy(keyOf)
            .ToDictionary(group => group.Key, group => new Queue<TEntity>(group));

        List<TEntity> added = new();

        foreach (TEntity entity in scanned)
        {
            if (unmatched.TryGetValue(keyOf(entity), out Queue<TEntity>? candidates)
                && candidates.TryDequeue(out TEntity? kept))
            {
                apply(kept, entity);
                continue;
            }

            added.Add(entity);
        }

        List<Guid> removedIds = unmatched.Values
            .SelectMany(queue => queue)
            .Select(entity => entity.Id)
            .ToList();

        return new InventoryChanges<TEntity>(added, removedIds);
    }

    private static (DependencyEcosystem, string, string) DependencyKey(Dependency dependency) =>
        (dependency.Ecosystem, dependency.Name.ToUpperInvariant(), dependency.CurrentVersion);

    private static (string, string) RuntimeKey(Runtime runtime) =>
        (runtime.Name.ToUpperInvariant(), runtime.Version.Trim());

    private static void ApplyScannedDependency(Dependency kept, Dependency scanned)
    {
        kept.Name = scanned.Name;
        kept.LatestVersion = scanned.LatestVersion;
        kept.Publisher = scanned.Publisher;
        kept.License = scanned.License;
        kept.IsDeprecated = scanned.IsDeprecated;
        kept.IsVersionPinned = scanned.IsVersionPinned;
        kept.ManifestPath = scanned.ManifestPath;
        kept.Type = scanned.Type;
        kept.IsDirect = scanned.IsDirect;

        if (kept.Status != DependencyStatus.Vulnerable) kept.Status = scanned.Status;
    }

    private static void ApplyScannedRuntime(Runtime kept, Runtime scanned)
    {
        kept.Name = scanned.Name;
        kept.Version = scanned.Version;
        kept.IsMinimumConstraint = scanned.IsMinimumConstraint;
        kept.IsEol = scanned.IsEol;
        kept.EolDate = scanned.EolDate;
    }
}
