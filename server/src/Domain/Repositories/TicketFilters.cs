using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record TicketValueFilter<TValue> where TValue : struct
{
    public static readonly TicketValueFilter<TValue> None = new();

    public IReadOnlyList<TValue> Values { get; init; } = [];

    public bool IsEmpty => Values.Count == 0;
}

public sealed record TicketReferenceFilter
{
    public static readonly TicketReferenceFilter None = new();

    public IReadOnlyList<Guid> Ids { get; init; } = [];
    public bool IncludeUnset { get; init; }

    public bool IsEmpty => Ids.Count == 0 && !IncludeUnset;
}

public sealed record TicketFilter
{
    public TicketValueFilter<TicketPriority> Priority { get; init; } = TicketValueFilter<TicketPriority>.None;
    public TicketValueFilter<TicketStatus> Status { get; init; } = TicketValueFilter<TicketStatus>.None;
    public TicketValueFilter<TicketType> Type { get; init; } = TicketValueFilter<TicketType>.None;
    public TicketReferenceFilter AssignedTo { get; init; } = TicketReferenceFilter.None;
    public TicketReferenceFilter Project { get; init; } = TicketReferenceFilter.None;
    public string? Search { get; init; }
}
