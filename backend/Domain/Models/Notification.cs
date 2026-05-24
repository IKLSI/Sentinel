namespace Sentinel.Domain.Models;

public enum NotificationType
{
    TicketAssigned,
    TicketStatusChanged,
    TicketComment,
    TicketCreatedByClient
}

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? TicketId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Ticket? Ticket { get; set; }
}
