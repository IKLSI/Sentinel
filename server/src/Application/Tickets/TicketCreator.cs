using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets;

public class TicketCreator(
    ITicketRepository ticketRepository,
    IOrganizationRepository organizationRepository,
    ICommitScopeFactory commitScopeFactory,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
    ITenantContext tenant)
{
    public static RealtimeEvent CreatedEvent(Ticket ticket) =>
        new(RealtimeResources.Tickets, ProjectIds: RealtimeEvent.AffectedProjects(ticket.ProjectId));

    public async Task InsertAsync(Ticket ticket, CancellationToken cancellationToken)
    {
        await commitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            ticket.Number = await organizationRepository.AllocateTicketNumbersAsync(ticket.OrganizationId, 1, token);
            await ticketRepository.AddAsync(ticket, token);
        }, cancellationToken);

        dashboardCache.Invalidate(ticket.OrganizationId);
    }

    public async Task<Result<TicketDto>> AuditAndLoadAsync(Ticket ticket, CancellationToken cancellationToken)
    {
        await auditLog.LogAsync(
            AuditAction.TicketCreated,
            entityType: AuditEntityTypes.Ticket,
            organizationId: ticket.OrganizationId,
            userId: ticket.CreatedById,
            entityId: ticket.Id,
            jti: tenant.Jti);

        return await LoadDtoAsync(ticket.Id, cancellationToken);
    }

    public async Task<Result<TicketDto>> LoadDtoAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        TicketDetailRow? ticket = await ticketRepository.GetOrDefaultDetailAsync(ticketId, cancellationToken);

        return Result<TicketDto>.Success(TicketMapper.ToDto(ticket!));
    }
}
