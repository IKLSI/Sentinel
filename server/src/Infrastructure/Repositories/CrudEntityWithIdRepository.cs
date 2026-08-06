using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public abstract class CrudEntityWithIdRepository<TEntity> : ICrudEntityWithIdRepository<TEntity>
    where TEntity : class, IEntityWithId
{
    protected CrudEntityWithIdRepository(SentinelContext context)
    {
        Context = context;
    }

    protected SentinelContext Context { get; }

    protected IQueryable<TEntity> Query(QueryTracking tracking) => tracking == QueryTracking.NoTracking
        ? Context.Set<TEntity>().AsNoTracking()
        : Context.Set<TEntity>();

    public Task<TEntity?> GetOrDefaultAsync(Guid id, QueryTracking tracking, CancellationToken cancellationToken) =>
        Query(tracking).FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking).AnyAsync(entity => entity.Id == id, cancellationToken);

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken) =>
        await Context.Set<TEntity>().AddAsync(entity, cancellationToken);

    public async Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken) =>
        await Context.Set<TEntity>().AddRangeAsync(entities, cancellationToken);

    public void Remove(TEntity entity) => Context.Set<TEntity>().Remove(entity);
}
