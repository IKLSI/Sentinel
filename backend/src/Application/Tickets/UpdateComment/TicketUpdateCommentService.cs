using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Application.Tickets.AddComment;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.UpdateComment;

public class TicketUpdateCommentService(
    ITicketCommentRepository commentRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IAuditLogService auditLog,
    ITenantContext tenant,
    TicketAddCommentValidator validator) : IService
{

    public async Task<Result<TicketCommentDto>> ExecuteAsync(Guid ticketId, Guid commentId, CreateCommentDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<TicketCommentDto>.From(validationResult);

        if (tenant.UserId is not Guid userId)
            return Result<TicketCommentDto>.Unauthorized();

        TicketComment? comment = await commentRepository.GetOrDefaultInTicketAsync(commentId, ticketId,
            new SingleEntityQueryOptions<TicketComment> { Include = query => query.Include(c => c.Author) },
            cancellationToken);

        if (comment == null)
            return Result<TicketCommentDto>.NotFound(ErrorCodes.TicketCommentNotFound);

        if (comment.AuthorId != userId)
            return Result<TicketCommentDto>.Forbidden();

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            comment.Content = model.Content;
            comment.UpdatedAt = DateTime.UtcNow;

            await unitOfWork.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.CommentUpdated,
            entityType: AuditEntityTypes.TicketComment,
            organizationId: tenant.OrganizationId,
            userId: userId,
            entityId: commentId,
            jti: tenant.Jti);

        return TicketMapper.ToDto(comment);
    }
}
