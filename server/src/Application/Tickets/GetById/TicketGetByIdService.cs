using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.GetById;

public class TicketGetByIdService(ITicketRepository ticketRepository, ITenantContext tenant) : IService
{
    public async Task<Result<TicketDto>> ExecuteAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is null)
            return Result<TicketDto>.Unauthorized();

        TicketDetailRow? ticket = await ticketRepository.GetOrDefaultDetailAsync(ticketId, cancellationToken);

        if (ticket == null)
            return Result<TicketDto>.NotFound(ErrorCodes.TicketNotFound);

        return TicketMapper.ToDto(ticket);
    }
}
