using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
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
    ICommitScopeFactory commitScopeFactory,
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

        TicketComment? comment = await commentRepository
            .GetOrDefaultInTicketWithAuthorAsync(commentId, ticketId, cancellationToken);

        if (comment == null)
            return Result<TicketCommentDto>.NotFound(ErrorCodes.TicketCommentNotFound);

        if (comment.AuthorId != userId)
            return Result<TicketCommentDto>.Forbidden();

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            comment.Content = model.Content;
            comment.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
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
