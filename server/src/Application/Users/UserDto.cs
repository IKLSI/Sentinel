using Sentinel.Domain.Entities;
using Sentinel.Application.Common.Contracts;
namespace Sentinel.Application.Users;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    [EnumValues(typeof(UserRole))]
    public string Role { get; set; } = string.Empty;
    [EnumValues(typeof(UserAccessStatus))]
    public string AccessStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    [EnumValues(typeof(ThemeType), lowercase: true)]
    public string Theme { get; set; } = "light";
    public string Language { get; set; } = "fr-FR";
}
