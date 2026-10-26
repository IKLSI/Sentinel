using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Grid;

public class UserGridModel : UserFilterRequest
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 25;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = DefaultPageSize;
    public UserSortField SortBy { get; set; } = UserSortField.Member;
    public SortDirection SortDirection { get; set; } = SortDirection.Asc;

    public int NormalizedPage => Paging.NormalizePage(Page);

    public int NormalizedPageSize => Paging.NormalizePageSize(PageSize, DefaultPageSize, MaxPageSize);
}
