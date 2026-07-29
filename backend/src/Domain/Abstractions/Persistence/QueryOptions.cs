using System.Linq.Expressions;

namespace Sentinel.Domain.Abstractions.Persistence;

public class QueryableQueryOptions
{
    public bool AsNoTracking { get; set; }
    public bool AsSplitQuery { get; set; }

    public static QueryableQueryOptions ReadOnly => new() { AsNoTracking = true };
    public static QueryableQueryOptions Tracked => new();
}

public class SingleEntityQueryOptions<TEntity> : QueryableQueryOptions
    where TEntity : class, IEntityWithId
{
    public Func<IQueryable<TEntity>, IQueryable<TEntity>>? Include { get; set; }

    public IQueryable<TEntity> ApplyIncludes(IQueryable<TEntity> query) => Include?.Invoke(query) ?? query;

    public QueryableQueryOptions ToQueryableQueryOptions() =>
        new() { AsNoTracking = AsNoTracking, AsSplitQuery = AsSplitQuery };
}

public class SingleProjectionQueryOptions<TEntity, TResult> : QueryableQueryOptions
    where TEntity : class, IEntityWithId
{
    public required Expression<Func<TEntity, TResult>> Expression { get; set; }

    public QueryableQueryOptions ToQueryableQueryOptions() =>
        new() { AsNoTracking = AsNoTracking, AsSplitQuery = AsSplitQuery };
}
