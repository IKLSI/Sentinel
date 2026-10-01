using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public class TicketHistory : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid TicketId { get; set; }
    public Guid? UserId { get; set; }
    public string Field { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;
    public User? User { get; set; }
}
