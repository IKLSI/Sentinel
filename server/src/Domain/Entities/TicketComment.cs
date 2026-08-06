using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public class TicketComment : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid TicketId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;
    public User Author { get; set; } = null!;
}
