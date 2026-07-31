using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Models;

public enum NotificationType
{
    TicketAssigned,
    TicketStatusChanged,
    TicketCommentAdded
}

public class Notification : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public NotificationType Type { get; set; }
    public string MessageKey { get; set; } = string.Empty;
    public string? MessageParams { get; set; }
    public Guid? TicketId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Ticket? Ticket { get; set; }
}
