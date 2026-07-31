using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Models;

public class ApiKey : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid OrganizationId { get; set; }
    public Guid CreatedById { get; set; }
    public string Name { get; set; } = string.Empty;
    public string KeyHash { get; set; } = string.Empty;
    public string Prefix { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRevoked { get; set; } = false;

    public Organization Organization { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
}
