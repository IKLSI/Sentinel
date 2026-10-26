using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Tickets.Create;

public class TicketCreateService(
    TicketLinkChecker linkChecker,
    TicketCreator ticketCreator,
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

        if (await linkChecker.FindMissingAsync(model.ProjectId, model.AssignedToId, organizationId,
                cancellationToken) is { } missingLinkCode)
            return Result<TicketDto>.NotFound(missingLinkCode);

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
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await ticketCreator.InsertAsync(ticket, cancellationToken);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId, TicketCreator.CreatedEvent(ticket));

        return await ticketCreator.AuditAndLoadAsync(ticket, cancellationToken);
    }
}
