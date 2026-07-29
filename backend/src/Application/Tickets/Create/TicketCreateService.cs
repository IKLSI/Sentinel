using System.Text.Json;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Notifications;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.Create;

public class TicketCreateService(
    ITicketRepository ticketRepository,
    ITicketStatusRepository ticketStatusRepository,
    IUnitOfWorkManager unitOfWorkManager,
    NotificationPublisher notificationPublisher,
    DashboardCache dashboardCache,
    IAuditLogService auditLog,
    ITenantContext tenant,
    ILogger<TicketCreateService> logger,
    TicketCreateValidator validator) : IService
{

    public async Task<Result<TicketDto>> ExecuteAsync(CreateTicketDto model, CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<TicketDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<TicketDto>.Unauthorized();

        TicketStatus? defaultStatus = await ticketStatusRepository
            .GetOrDefaultFirstByOrderAsync(organizationId, cancellationToken);

        Ticket ticket = new Ticket
        {
            OrganizationId = organizationId,
            ProjectId = model.ProjectId,
            Title = model.Title,
            Description = model.Description,
            Priority = model.Priority,
            Type = model.Type,
            TicketStatusId = defaultStatus?.Id,
            AssignedToId = model.AssignedToId,
            EstimatedHours = model.EstimatedHours,
            CreatedById = userId,
            Tags = JsonSerializer.Serialize(model.Tags),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            await ticketRepository.AddAsync(ticket, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
        }

        dashboardCache.Invalidate(organizationId);

        await NotifyAssigneeAsync(ticket, userId, organizationId, cancellationToken);

        await auditLog.LogAsync(
            AuditAction.TicketCreated,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: userId,
            entityId: ticket.Id,
            jti: tenant.Jti);

        Ticket? created = await ticketRepository.GetOrDefaultAsync(ticket.Id, TicketQueries.Details, cancellationToken);

        return Result<TicketDto>.Success(TicketMapper.ToDto(created!));
    }

    private async Task NotifyAssigneeAsync(Ticket ticket, Guid authorId, Guid organizationId,
        CancellationToken cancellationToken)
    {
        if (ticket.AssignedToId is not Guid assigneeId || assigneeId == authorId) return;

        try
        {
            await notificationPublisher.PublishAsync(
                assigneeId,
                organizationId,
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
