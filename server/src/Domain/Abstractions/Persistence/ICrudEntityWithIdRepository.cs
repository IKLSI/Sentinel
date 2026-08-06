namespace Sentinel.Domain.Abstractions.Persistence;

public interface ICrudEntityWithIdRepository<TEntity>
    where TEntity : class, IEntityWithId
{
    Task<TEntity?> GetOrDefaultAsync(Guid id, QueryTracking tracking, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken);

    Task AddAsync(TEntity entity, CancellationToken cancellationToken);

    Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken);

    void Remove(TEntity entity);
}
