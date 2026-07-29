namespace Sentinel.Domain.Abstractions.Persistence;

public interface ICrudEntityWithIdRepository<TEntity>
    where TEntity : class, IEntityWithId
{
    Task<TEntity?> GetOrDefaultAsync(Guid id, SingleEntityQueryOptions<TEntity> options,
        CancellationToken cancellationToken);

    Task<TResult?> GetOrDefaultAsync<TResult>(Guid id, SingleProjectionQueryOptions<TEntity, TResult> options,
        CancellationToken cancellationToken);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken);

    IQueryable<TEntity> GetAll(QueryableQueryOptions options);

    Task AddAsync(TEntity entity, CancellationToken cancellationToken);

    Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken);

    void Remove(TEntity entity);
}
