using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Notifications;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.AddComment;

public class TicketAddCommentService(
    ITicketRepository ticketRepository,
    ITicketCommentRepository commentRepository,
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    NotificationPublisher notificationPublisher,
    IAuditLogService auditLog,
    ITenantContext tenant,
    TicketAddCommentValidator validator,
    ILogger<TicketAddCommentService> logger) : IService
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

        await NotifyAssigneeAsync(ticket, userId, cancellationToken);

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
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }

    private async Task NotifyAssigneeAsync(Ticket ticket, Guid authorId, CancellationToken cancellationToken)
    {
        if (ticket.AssignedToId is not Guid assigneeId || assigneeId == authorId) return;

        try
        {
            await notificationPublisher.PublishAsync(
                assigneeId,
                ticket.OrganizationId,
                NotificationType.TicketCommentAdded,
                NotificationCodes.TicketCommentAdded,
                new Dictionary<string, string> { ["title"] = ticket.Title },
                ticket.Id,
                cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Échec création notification de commentaire pour ticket {TicketId}", ticket.Id);
        }
    }
}
