using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Models;

public class UserInvitation : IEntityWithId
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Developer;
    public string TokenHash { get; set; } = string.Empty;
    public Guid InvitedById { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
    public User InvitedBy { get; set; } = null!;
}
