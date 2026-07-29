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

    public Task<TEntity?> GetOrDefaultAsync(Guid id, SingleEntityQueryOptions<TEntity> options,
        CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

    public Task<TResult?> GetOrDefaultAsync<TResult>(Guid id, SingleProjectionQueryOptions<TEntity, TResult> options,
        CancellationToken cancellationToken) =>
        GetAll(options.ToQueryableQueryOptions())
            .Where(entity => entity.Id == id)
            .Select(options.Expression)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken) =>
        Context.Set<TEntity>().AsNoTracking().AnyAsync(entity => entity.Id == id, cancellationToken);

    public IQueryable<TEntity> GetAll(QueryableQueryOptions options)
    {
        IQueryable<TEntity> query = Context.Set<TEntity>();

        if (options.AsNoTracking) query = query.AsNoTracking();
        if (options.AsSplitQuery) query = query.AsSplitQuery();

        return query;
    }

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken) =>
        await Context.Set<TEntity>().AddAsync(entity, cancellationToken);

    public async Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken) =>
        await Context.Set<TEntity>().AddRangeAsync(entities, cancellationToken);

    public void Remove(TEntity entity) => Context.Set<TEntity>().Remove(entity);
}
