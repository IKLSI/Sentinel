using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users;

public static class UserMapper
{
    public static UserDto ToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Role = user.Role.ToString(),
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        Theme = user.Theme.ToString().ToLowerInvariant(),
        Language = user.Language,
    };

    public static UserDto ToDto(UserGridRow row) => new()
    {
        Id = row.Id,
        Email = row.Email,
        FirstName = row.FirstName,
        LastName = row.LastName,
        Role = row.Role.ToString(),
        IsActive = row.IsActive,
        CreatedAt = row.CreatedAt,
        LastLoginAt = row.LastLoginAt,
        Theme = row.Theme.ToString().ToLowerInvariant(),
        Language = row.Language,
    };
}
