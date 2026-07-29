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
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.DeleteComment;

public class TicketDeleteCommentService(
    ITicketCommentRepository commentRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{

    public async Task<Result> ExecuteAsync(Guid ticketId, Guid commentId, CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid userId)
            return Result.Unauthorized();

        TicketComment? comment = await commentRepository.GetOrDefaultInTicketAsync(commentId, ticketId,
            new SingleEntityQueryOptions<TicketComment>(), cancellationToken);

        if (comment == null)
            return Result.NotFound(ErrorCodes.TicketCommentNotFound);

        if (comment.AuthorId != userId)
            return Result.Forbidden();

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            commentRepository.Remove(comment);
            await unitOfWork.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.CommentDeleted,
            entityType: AuditEntityTypes.TicketComment,
            organizationId: tenant.OrganizationId,
            userId: userId,
            entityId: commentId,
            jti: tenant.Jti);

        return Result.NoContent();
    }
}
