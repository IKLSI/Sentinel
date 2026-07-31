using Sentinel.Domain.Models;

namespace Sentinel.Domain.Abstractions;

public sealed record AttachmentLocation(byte[]? InlineContent, string? StorageKey);

public interface IAttachmentStorage
{
    Task<AttachmentLocation> SaveAsync(Guid attachmentId, Stream content, CancellationToken cancellationToken);

    Task<Stream?> OpenReadAsync(TicketAttachment attachment, CancellationToken cancellationToken);
}
