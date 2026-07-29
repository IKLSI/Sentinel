namespace Sentinel.Domain.Abstractions.Persistence;

public sealed record PagedList<TItem>(IReadOnlyList<TItem> Items, int TotalCount);
