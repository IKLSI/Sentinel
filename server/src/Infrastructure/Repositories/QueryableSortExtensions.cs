using System.Linq.Expressions;

namespace Sentinel.Infrastructure.Repositories;

internal static class QueryableSortExtensions
{
    public static IOrderedQueryable<T> OrderBy<T, TKey>(this IQueryable<T> query,
        Expression<Func<T, TKey>> key, bool descending) =>
        descending ? Queryable.OrderByDescending(query, key) : Queryable.OrderBy(query, key);

    public static IOrderedQueryable<T> ThenBy<T, TKey>(this IOrderedQueryable<T> query,
        Expression<Func<T, TKey>> key, bool descending) =>
        descending ? Queryable.ThenByDescending(query, key) : Queryable.ThenBy(query, key);
}
