using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.AddComment;

public class TicketAddCommentService(
    ITicketRepository ticketRepository,
    ITicketCommentRepository commentRepository,
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    TicketAddCommentValidator validator) : IService
{
    public async Task<Result<TicketCommentDto>> ExecuteAsync(Guid ticketId, CreateCommentDto model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<TicketCommentDto>.Unauthorized();

        Ticket? ticket = await ticketRepository.GetOrDefaultAsync(ticketId,
            QueryTracking.Tracked, cancellationToken);

        if (ticket == null || ticket.OrganizationId != organizationId)
            return Result<TicketCommentDto>.NotFound(ErrorCodes.TicketNotFound);

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<TicketCommentDto>.From(validationResult);

        TicketComment comment = new TicketComment
        {
            TicketId = ticketId,
            AuthorId = userId,
            Content = model.Content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await commentRepository.AddAsync(comment, cancellationToken);
            ticket.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Ticket, ticketId), cancellationToken);

        await auditLog.LogAsync(
            AuditAction.CommentAdded,
            entityType: AuditEntityTypes.TicketComment,
            organizationId: organizationId,
            userId: userId,
            entityId: comment.Id,
            jti: tenant.Jti);

        User? author = await userRepository.GetOrDefaultAsync(userId,
            QueryTracking.NoTracking, cancellationToken);

        return new TicketCommentDto
        {
            Id = comment.Id,
            AuthorId = comment.AuthorId,
            AuthorName = author?.FullName ?? string.Empty,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        };
    }
}
