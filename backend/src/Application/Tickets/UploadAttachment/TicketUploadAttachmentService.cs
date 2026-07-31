using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.UploadAttachment;

public class TicketUploadAttachmentService(
    ITicketRepository ticketRepository,
    ITicketAttachmentRepository attachmentRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    ITenantContext tenant,
    IAttachmentStorage storage,
    TicketUploadAttachmentValidator validator) : IService
{
    public async Task<Result<TicketAttachmentDto>> ExecuteAsync(Guid ticketId, TicketAttachmentUploadModel? model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<TicketAttachmentDto>.Unauthorized();

        bool ticketExists = await ticketRepository
            .ExistsInOrganizationAsync(ticketId, organizationId, cancellationToken);

        if (!ticketExists)
            return Result<TicketAttachmentDto>.NotFound(ErrorCodes.TicketNotFound);

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess || model == null)
            return Result<TicketAttachmentDto>.From(validationResult);

        Guid attachmentId = Guid.CreateVersion7();
        AttachmentLocation location = await storage.SaveAsync(attachmentId, model.Content, cancellationToken);

        TicketAttachment attachment = new TicketAttachment
        {
            Id = attachmentId,
            TicketId = ticketId,
            UploadedById = userId,
            FileName = Path.GetFileName(model.FileName),
            Content = location.InlineContent,
            StoragePath = location.StorageKey,
            ContentType = model.ContentType,
            CreatedAt = DateTime.UtcNow
        };

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await attachmentRepository.AddAsync(attachment, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.AttachmentUploaded,
            entityType: AuditEntityTypes.TicketAttachment,
            organizationId: organizationId,
            userId: userId,
            entityId: attachmentId,
            jti: tenant.Jti);

        return new TicketAttachmentDto
        {
            Id = attachment.Id,
            TicketId = attachment.TicketId,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            CreatedAt = attachment.CreatedAt
        };
    }

}
