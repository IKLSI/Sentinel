using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets.Grid;

public class TicketGridService(
    ITicketRepository ticketRepository,
    ITenantContext tenant,
    TicketGridValidator validator) : IService
{
    public async Task<Result<PagedResult<TicketDto>>> ExecuteAsync(TicketGridModel model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<PagedResult<TicketDto>>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<PagedResult<TicketDto>>.From(validationResult);

        PagedList<Ticket> page = await ticketRepository.SearchAsync(organizationId, BuildFilter(model),
            model.Page, model.PageSize, cancellationToken);

        return new PagedResult<TicketDto>
        {
            Items = page.Items.Select(TicketMapper.ToDto).ToList(),
            TotalCount = page.TotalCount,
            Page = model.Page,
            PageSize = model.PageSize
        };
    }

    private static TicketFilter BuildFilter(TicketGridModel model) => new()
    {
        Priority = !string.IsNullOrEmpty(model.Priority)
            && Enum.TryParse(model.Priority, true, out TicketPriority priority)
            ? priority
            : null,
        TicketStatusId = !string.IsNullOrEmpty(model.Status) && Guid.TryParse(model.Status, out Guid statusId)
            ? statusId
            : null,
        AssignedToId = model.AssignedTo,
        Type = !string.IsNullOrEmpty(model.Type) && Enum.TryParse(model.Type, true, out TicketType type)
            ? type
            : null,
        Search = model.Search
    };
}
