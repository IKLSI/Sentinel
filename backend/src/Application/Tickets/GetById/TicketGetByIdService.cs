using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.GetById;

public class TicketGetByIdService(ITicketRepository ticketRepository, ITenantContext tenant) : IService
{
    public async Task<Result<TicketDto>> ExecuteAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<TicketDto>.Unauthorized();

        Ticket? ticket = await ticketRepository.GetOrDefaultWithDetailsAsync(ticketId, cancellationToken);

        if (ticket == null)
            return Result<TicketDto>.NotFound(ErrorCodes.TicketNotFound);

        if (ticket.OrganizationId != organizationId)
            return Result<TicketDto>.Forbidden();

        return TicketMapper.ToDto(ticket);
    }
}
