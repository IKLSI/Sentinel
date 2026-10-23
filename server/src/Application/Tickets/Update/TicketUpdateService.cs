using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.Update;

public class TicketUpdateService(
    ITicketRepository ticketRepository,
    ITicketHistoryRepository ticketHistoryRepository,
    TicketLinkChecker linkChecker,
    ICommitScopeFactory commitScopeFactory,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
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

        if (await linkChecker.FindMissingAsync(model.ProjectId, model.AssignedToId, organizationId,
                cancellationToken) is { } missingLinkCode)
            return Result<TicketDto>.NotFound(missingLinkCode);

        TicketStatus? newStatus = null;

        if (model.Status != null)
        {
            if (!EnumValue.TryParse(model.Status, out TicketStatus parsedStatus))
                return Result<TicketDto>.Error(ErrorCodes.TicketInvalidStatus);

            newStatus = parsedStatus;
        }

        Guid? previousProjectId = ticket.ProjectId;
        string oldStatusCode = ticket.Status.ToString().ToLower();
        string newStatusCode = (newStatus ?? ticket.Status).ToString().ToLower();

        List<TicketHistory> changes = ApplyChanges(ticket, model, newStatus, userId);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            if (changes.Count > 0)
                await ticketHistoryRepository.AddRangeAsync(changes, cancellationToken);

            await commitScope.CommitAsync(cancellationToken);
        }

        dashboardCache.Invalidate(organizationId);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Ticket, ticketId,
                RealtimeEvent.AffectedProjects(previousProjectId, ticket.ProjectId)));

        bool statusChanged = newStatus.HasValue && oldStatusCode != newStatusCode;

        await auditLog.LogAsync(
            statusChanged ? AuditAction.TicketStatusChanged : AuditAction.TicketUpdated,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: userId,
            entityId: ticketId,
            jti: tenant.Jti);

        Ticket? updated = await ticketRepository.GetOrDefaultWithDetailsAsync(ticketId, cancellationToken);

        return Result<TicketDto>.Success(TicketMapper.ToDto(updated!));
    }

    private static List<TicketHistory> ApplyChanges(Ticket ticket, UpdateTicketDto model, TicketStatus? newStatus,
        Guid userId)
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

        if (model.AssignedToId != ticket.AssignedToId)
        {
            changes.Add(TicketQueries.CreateHistory(ticket.Id, userId, "AssignedTo",
                ticket.AssignedToId?.ToString(), model.AssignedToId?.ToString()));
            ticket.AssignedToId = model.AssignedToId;
        }

        if (newStatus.HasValue && newStatus.Value != ticket.Status)
        {
            changes.Add(TicketQueries.CreateHistory(ticket.Id, userId, "Status",
                ticket.Status.ToString().ToLower(), newStatus.Value.ToString().ToLower()));
            ticket.Status = newStatus.Value;
            ticket.AutoResolvedAt = null;
        }

        ticket.UpdatedAt = DateTime.UtcNow;

        return changes;
    }
}
