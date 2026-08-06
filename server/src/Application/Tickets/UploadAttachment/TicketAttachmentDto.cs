namespace Sentinel.Application.Tickets.UploadAttachment;

public class TicketAttachmentDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
