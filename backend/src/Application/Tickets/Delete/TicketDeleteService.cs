using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.Delete;

public class TicketDeleteService(
    ITicketRepository ticketRepository,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
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
