using Sentinel.Domain.Entities;

namespace Sentinel.Application.Auth;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public UserProfile User { get; set; } = null!;
}

public class UserProfile
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string Theme { get; set; } = "light";
    public string Language { get; set; } = LanguageValues.Fr;
}
