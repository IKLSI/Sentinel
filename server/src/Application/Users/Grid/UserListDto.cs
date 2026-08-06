using Sentinel.Application.Users;

namespace Sentinel.Application.Users.Grid;

public class UserListDto
{
    public required IReadOnlyList<UserDto> Items { get; init; }
    public required int Total { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}
