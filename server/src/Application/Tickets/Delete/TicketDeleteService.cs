using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.Delete;

public class TicketDeleteService(
    ITicketRepository ticketRepository,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result.Unauthorized();

        Ticket? ticket = await ticketRepository.GetOrDefaultAsync(ticketId, QueryTracking.NoTracking,
            cancellationToken);

        int deleted = await ticketRepository.DeleteInOrganizationAsync(ticketId, organizationId, cancellationToken);

        if (deleted == 0)
            return Result.NotFound(ErrorCodes.TicketNotFound);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Ticket, ticketId,
                RealtimeEvent.AffectedProjects(ticket?.ProjectId)));

        await auditLog.LogAsync(
            AuditAction.TicketDeleted,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: ticketId,
            jti: tenant.Jti);

        return Result.NoContent();
    }
}
