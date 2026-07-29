using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Notifications;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.ChangeStatus;

public class TicketChangeStatusService(
    ITicketRepository ticketRepository,
    ITicketStatusRepository ticketStatusRepository,
    ITicketHistoryRepository ticketHistoryRepository,
    ICommitScopeFactory commitScopeFactory,
    NotificationPublisher notificationPublisher,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
    ITenantContext tenant,
    ILogger<TicketChangeStatusService> logger,
    TicketChangeStatusValidator validator) : IService
{
    private const string UnknownStatusName = "Inconnu";

    public async Task<Result<TicketDto>> ExecuteAsync(Guid ticketId, ChangeStatusDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<TicketDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<TicketDto>.Unauthorized();

        Ticket? ticket = await ticketRepository.GetOrDefaultWithStatusAsync(ticketId, cancellationToken);

        if (ticket == null || ticket.OrganizationId != organizationId)
            return Result<TicketDto>.NotFound(ErrorCodes.TicketNotFound);

        TicketStatus? newStatus = await ticketStatusRepository.GetOrDefaultAsync(model.StatusId,
            QueryTracking.Tracked, cancellationToken);

        if (newStatus == null || newStatus.OrganizationId != ticket.OrganizationId)
            return Result<TicketDto>.Error(ErrorCodes.TicketInvalidStatus);

        string oldStatusName = ticket.TicketStatus?.Name ?? UnknownStatusName;

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            ticket.TicketStatusId = newStatus.Id;
            ticket.UpdatedAt = DateTime.UtcNow;

            await ticketHistoryRepository.AddAsync(
                TicketQueries.CreateHistory(ticketId, userId, "Status", oldStatusName, newStatus.Name),
                cancellationToken);

            await commitScope.CommitAsync(cancellationToken);
        }

        dashboardCache.Invalidate(organizationId);

        await NotifyAssigneeAsync(ticket, userId, oldStatusName, newStatus.Name, cancellationToken);

        await auditLog.LogAsync(
            AuditAction.TicketStatusChanged,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: userId,
            entityId: ticketId,
            jti: tenant.Jti);

        Ticket? updated = await ticketRepository.GetOrDefaultWithDetailsAsync(ticketId, cancellationToken);

        return Result<TicketDto>.Success(TicketMapper.ToDto(updated!));
    }

    private async Task NotifyAssigneeAsync(Ticket ticket, Guid authorId, string oldStatusName, string newStatusName,
        CancellationToken cancellationToken)
    {
        if (ticket.AssignedToId is not Guid assigneeId || assigneeId == authorId) return;

        try
        {
            await notificationPublisher.PublishAsync(
                assigneeId,
                ticket.OrganizationId,
                NotificationType.TicketStatusChanged,
                NotificationCodes.TicketStatusChanged,
                new Dictionary<string, string>
                {
                    ["title"] = ticket.Title,
                    ["oldStatus"] = oldStatusName,
                    ["newStatus"] = newStatusName
                },
                ticket.Id,
                cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception,
                "Échec création notification de changement de statut pour ticket {TicketId}", ticket.Id);
        }
    }
}
