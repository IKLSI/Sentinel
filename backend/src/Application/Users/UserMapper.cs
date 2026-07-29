using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;

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
}
