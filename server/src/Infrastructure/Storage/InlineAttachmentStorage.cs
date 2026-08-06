using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Storage;

public class InlineAttachmentStorage : IAttachmentStorage
{
    public async Task<AttachmentLocation> SaveAsync(Guid attachmentId, Stream content,
        CancellationToken cancellationToken)
    {
        if (content.CanSeek)
        {
            content.Seek(0, SeekOrigin.Begin);

            byte[] exact = new byte[content.Length];
            await content.ReadExactlyAsync(exact, cancellationToken);

            return new AttachmentLocation(exact, null);
        }

        using MemoryStream buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);

        return new AttachmentLocation(buffer.ToArray(), null);
    }

    public Task<Stream?> OpenReadAsync(TicketAttachment attachment, CancellationToken cancellationToken)
    {
        Stream? stream = attachment.Content is { Length: > 0 } content
            ? new MemoryStream(content, writable: false)
            : null;

        return Task.FromResult(stream);
    }
}
