using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.Grid;

public class TicketGridModel : TicketFilterRequest
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 25;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = DefaultPageSize;
    public TicketSortField SortBy { get; set; } = TicketSortField.Priority;
    public SortDirection SortDirection { get; set; } = SortDirection.Desc;

    public int NormalizedPage => Paging.NormalizePage(Page);

    public int NormalizedPageSize => Paging.NormalizePageSize(PageSize, DefaultPageSize, MaxPageSize);
}
