using Sentinel.Domain.Entities;

namespace Sentinel.Application.Auth;

public static class UserProfileMapper
{
    public static UserProfile ToProfile(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Role = user.Role.ToString(),
        Theme = user.Theme.ToString().ToLowerInvariant(),
        Language = user.Language
    };
}
