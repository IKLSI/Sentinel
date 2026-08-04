using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.DownloadAttachment;

public class TicketDownloadAttachmentService(
    ITicketAttachmentRepository attachmentRepository,
    IAttachmentStorage storage,
    ITenantContext tenant) : IService
{
    public async Task<Result<FileDownload>> ExecuteAsync(Guid ticketId, Guid attachmentId,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<FileDownload>.Unauthorized();

        TicketAttachment? attachment = await attachmentRepository
            .GetOrDefaultInTicketWithTicketAsync(attachmentId, ticketId, cancellationToken);

        if (attachment == null || attachment.Ticket.OrganizationId != organizationId)
            return Result<FileDownload>.NotFound(ErrorCodes.TicketAttachmentNotFound);

        Stream? content = await storage.OpenReadAsync(attachment, cancellationToken);

        if (content == null)
            return Result<FileDownload>.NotFound(ErrorCodes.TicketAttachmentFileMissing);

        return new FileDownload(content, attachment.ContentType, attachment.FileName);
    }
}
