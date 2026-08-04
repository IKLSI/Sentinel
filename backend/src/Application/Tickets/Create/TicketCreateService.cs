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

namespace Sentinel.Application.Tickets.Create;

public class TicketCreateService(
    ITicketRepository ticketRepository,
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    ICommitScopeFactory commitScopeFactory,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    TicketCreateValidator validator) : IService
{
    public async Task<Result<TicketDto>> ExecuteAsync(CreateTicketDto model, CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<TicketDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<TicketDto>.Unauthorized();

        if (model.ProjectId is Guid projectId &&
            !await projectRepository.ExistsInOrganizationAsync(projectId, organizationId, cancellationToken))
            return Result<TicketDto>.NotFound(ErrorCodes.ProjectNotFound);

        if (model.AssignedToId is Guid assignedToId &&
            await userRepository.GetOrDefaultInOrganizationAsync(assignedToId, organizationId,
                QueryTracking.NoTracking, cancellationToken) is null)
            return Result<TicketDto>.NotFound(ErrorCodes.UserNotFound);

        Ticket ticket = new Ticket
        {
            OrganizationId = organizationId,
            ProjectId = model.ProjectId,
            Title = model.Title,
            Description = model.Description,
            Priority = model.Priority,
            Type = model.Type,
            Status = TicketStatus.New,
            AssignedToId = model.AssignedToId,
            EstimatedHours = model.EstimatedHours,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await commitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            ticket.Number = await organizationRepository.AllocateTicketNumberAsync(organizationId, token);
            await ticketRepository.AddAsync(ticket, token);
        }, cancellationToken);

        dashboardCache.Invalidate(organizationId);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Tickets), cancellationToken);

        await auditLog.LogAsync(
            AuditAction.TicketCreated,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: userId,
            entityId: ticket.Id,
            jti: tenant.Jti);

        Ticket? created = await ticketRepository.GetOrDefaultWithDetailsAsync(ticket.Id, cancellationToken);

        return Result<TicketDto>.Success(TicketMapper.ToDto(created!));
    }
}
