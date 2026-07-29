using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
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
    IUserRepository userRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IAuditLogService auditLog,
    ITenantContext tenant,
    IContentPathProvider contentPath,
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

        Guid attachmentId = Guid.NewGuid();
        string storagePath = await StoreFileAsync(ticketId, attachmentId, model, cancellationToken);

        TicketAttachment attachment = new TicketAttachment
        {
            Id = attachmentId,
            TicketId = ticketId,
            UploadedById = userId,
            FileName = Path.GetFileName(model.FileName),
            StoragePath = storagePath,
            ContentType = model.ContentType,
            Size = model.Size,
            CreatedAt = DateTime.UtcNow
        };

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            await attachmentRepository.AddAsync(attachment, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
        }

        User? uploader = await userRepository.GetOrDefaultAsync(userId,
            new SingleEntityQueryOptions<User> { AsNoTracking = true }, cancellationToken);

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
            Size = attachment.Size,
            UploadedById = attachment.UploadedById,
            UploadedByName = uploader != null ? $"{uploader.FirstName} {uploader.LastName}" : string.Empty,
            CreatedAt = attachment.CreatedAt
        };
    }

    private async Task<string> StoreFileAsync(Guid ticketId, Guid attachmentId, TicketAttachmentUploadModel model,
        CancellationToken cancellationToken)
    {
        string uploadDirectory = Path.Combine(AttachmentsRoot, ticketId.ToString());

        Directory.CreateDirectory(uploadDirectory);

        string storagePath = Path.Combine(uploadDirectory, $"{attachmentId:N}_{model.SanitizedFileName}");

        await using FileStream stream = new FileStream(storagePath, FileMode.Create);
        await model.Content.CopyToAsync(stream, cancellationToken);

        return storagePath;
    }

    private string AttachmentsRoot => Path.Combine(contentPath.ContentRootPath, "App_Data", "attachments");
}
