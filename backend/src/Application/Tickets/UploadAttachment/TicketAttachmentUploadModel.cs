namespace Sentinel.Application.Tickets.UploadAttachment;

public class TicketAttachmentUploadModel
{
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long Size { get; init; }
    public required Stream Content { get; init; }

    public string SanitizedFileName =>
        string.Concat(Path.GetFileName(FileName).Where(c => !Path.GetInvalidFileNameChars().Contains(c))).Replace(" ", "_");
}
