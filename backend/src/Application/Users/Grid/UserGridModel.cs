using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Grid;

public class UserGridModel
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 25;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = DefaultPageSize;
    public string? Search { get; set; }
    public UserRole? Role { get; set; }
    public UserSortField SortBy { get; set; } = UserSortField.Member;
    public SortDirection SortDirection { get; set; } = SortDirection.Asc;

    public int NormalizedPage => Page < 1 ? 1 : Page;

    public int NormalizedPageSize => PageSize switch
    {
        < 1 => DefaultPageSize,
        > MaxPageSize => MaxPageSize,
        _ => PageSize
    };
}
