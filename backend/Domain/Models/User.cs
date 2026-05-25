namespace Sentinel.Domain.Models;

public enum UserRole
{
    Admin,
    Developer,
    Client
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Developer;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string? PreviousRefreshTokenHash { get; set; }
    public int TokenVersion { get; set; }
    public string Theme { get; set; } = "light";
    public string Language { get; set; } = "fr-FR";

    public Organization Organization { get; set; } = null!;
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();

    public string FullName => $"{FirstName} {LastName}".Trim();
}
