using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public class TicketAttachment : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid TicketId { get; set; }
    public Guid UploadedById { get; set; }
    public string FileName { get; set; } = string.Empty;
    public byte[]? Content { get; set; }
    public long ContentLength { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}
