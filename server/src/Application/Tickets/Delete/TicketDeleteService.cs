using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.Delete;

public class TicketDeleteService(
    ITicketRepository ticketRepository,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result.Unauthorized();

        int deleted = await ticketRepository.DeleteInOrganizationAsync(ticketId, organizationId, cancellationToken);

        if (deleted == 0)
            return Result.NotFound(ErrorCodes.TicketNotFound);

        dashboardCache.Invalidate(organizationId);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Ticket, ticketId));

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
