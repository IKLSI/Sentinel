using System.Text.Json;
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

namespace Sentinel.Application.Tickets.Update;

public class TicketUpdateService(
    ITicketRepository ticketRepository,
    ITicketHistoryRepository ticketHistoryRepository,
    ICommitScopeFactory commitScopeFactory,
    NotificationPublisher notificationPublisher,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
    ITenantContext tenant,
    ILogger<TicketUpdateService> logger,
    TicketUpdateValidator validator) : IService
{
    public async Task<Result<TicketDto>> ExecuteAsync(Guid ticketId, UpdateTicketDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<TicketDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<TicketDto>.Unauthorized();

        Ticket? ticket = await ticketRepository.GetOrDefaultAsync(ticketId,
            QueryTracking.Tracked, cancellationToken);

        if (ticket == null || ticket.OrganizationId != organizationId)
            return Result<TicketDto>.NotFound(ErrorCodes.TicketNotFound);

        List<TicketHistory> changes = ApplyChanges(ticket, model, userId, out bool assigneeChanged);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            if (changes.Count > 0)
                await ticketHistoryRepository.AddRangeAsync(changes, cancellationToken);

            await commitScope.CommitAsync(cancellationToken);
        }

        dashboardCache.Invalidate(organizationId);

        if (assigneeChanged)
            await NotifyAssigneeAsync(ticket, model.AssignedToId, userId, cancellationToken);

        await auditLog.LogAsync(
            AuditAction.TicketUpdated,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: userId,
            entityId: ticketId,
            jti: tenant.Jti);

        Ticket? updated = await ticketRepository.GetOrDefaultWithDetailsAsync(ticketId, cancellationToken);

        return Result<TicketDto>.Success(TicketMapper.ToDto(updated!));
    }

    private static List<TicketHistory> ApplyChanges(Ticket ticket, UpdateTicketDto model, Guid userId,
        out bool assigneeChanged)
    {
        List<TicketHistory> changes = [];

        if (model.Title != null && model.Title != ticket.Title)
            ticket.Title = model.Title;

        if (model.Description != null && model.Description != ticket.Description)
            ticket.Description = model.Description;

        if (model.Priority.HasValue && model.Priority.Value != ticket.Priority)
        {
            changes.Add(TicketQueries.CreateHistory(ticket.Id, userId, "Priority",
                ticket.Priority.ToString(), model.Priority.Value.ToString()));
            ticket.Priority = model.Priority.Value;
        }

        if (model.Type.HasValue && model.Type.Value != ticket.Type)
        {
            changes.Add(TicketQueries.CreateHistory(ticket.Id, userId, "Type",
                ticket.Type.ToString(), model.Type.Value.ToString()));
            ticket.Type = model.Type.Value;
        }

        if (model.ProjectId != ticket.ProjectId)
            ticket.ProjectId = model.ProjectId;

        assigneeChanged = model.AssignedToId != ticket.AssignedToId;

        if (assigneeChanged)
        {
            changes.Add(TicketQueries.CreateHistory(ticket.Id, userId, "AssignedTo",
                ticket.AssignedToId?.ToString(), model.AssignedToId?.ToString()));
            ticket.AssignedToId = model.AssignedToId;
        }

        if (model.EstimatedHours.HasValue && model.EstimatedHours != ticket.EstimatedHours)
        {
            changes.Add(TicketQueries.CreateHistory(ticket.Id, userId, "EstimatedHours",
                ticket.EstimatedHours?.ToString(), model.EstimatedHours.Value.ToString()));
            ticket.EstimatedHours = model.EstimatedHours;
        }

        if (model.Tags != null)
            ticket.Tags = JsonSerializer.Serialize(model.Tags);

        ticket.UpdatedAt = DateTime.UtcNow;

        return changes;
    }

    private async Task NotifyAssigneeAsync(Ticket ticket, Guid? assignedToId, Guid authorId,
        CancellationToken cancellationToken)
    {
        if (assignedToId is not Guid assigneeId || assigneeId == authorId) return;

        try
        {
            await notificationPublisher.PublishAsync(
                assigneeId,
                ticket.OrganizationId,
                NotificationType.TicketAssigned,
                NotificationCodes.TicketAssigned,
                new Dictionary<string, string> { ["title"] = ticket.Title },
                ticket.Id,
                cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Échec création notification d'assignation pour ticket {TicketId}", ticket.Id);
        }
    }
}
