using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public enum ThemeType
{
    Light,
    Dark
}

public static class LanguageValues
{
    public const string Fr = "fr-FR";
    public const string En = "en-US";
    public static readonly string[] All = [Fr, En];
}

public enum UserRole
{
    Admin,
    Developer
}

public enum UserAccessStatus
{
    Active,
    Suspended
}

public class User : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid OrganizationId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Developer;
    public UserAccessStatus AccessStatus { get; set; } = UserAccessStatus.Active;
    public bool IsEmailVerified { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string? PreviousRefreshTokenHash { get; set; }
    public int TokenVersion { get; set; }
    public ThemeType Theme { get; set; } = ThemeType.Light;
    public string Language { get; set; } = LanguageValues.Fr;

    public Organization Organization { get; set; } = null!;

    public string FullName => PersonName.Format(FirstName, LastName) ?? string.Empty;

    public void RevokeSessions()
    {
        RefreshToken = null;
        RefreshTokenExpiry = null;
        TokenVersion++;
    }
}
