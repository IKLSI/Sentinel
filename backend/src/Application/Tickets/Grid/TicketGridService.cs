using Microsoft.EntityFrameworkCore;
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
    ITicketCommentRepository commentRepository,
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

        IQueryable<Ticket> query = BuildQuery(organizationId, model);

        int totalCount = await query.CountAsync(cancellationToken);

        List<Ticket> tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((model.Page - 1) * model.PageSize)
            .Take(model.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<TicketDto>
        {
            Items = tickets.Select(TicketMapper.ToDto).ToList(),
            TotalCount = totalCount,
            Page = model.Page,
            PageSize = model.PageSize
        };
    }

    private IQueryable<Ticket> BuildQuery(Guid organizationId, TicketGridModel model)
    {
        IQueryable<Ticket> query = TicketQueries.WithGridIncludes(
            ticketRepository.GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly));

        if (!string.IsNullOrEmpty(model.Priority) && Enum.TryParse(model.Priority, true, out TicketPriority priority))
            query = query.Where(t => t.Priority == priority);

        if (!string.IsNullOrEmpty(model.Status) && Guid.TryParse(model.Status, out Guid statusId))
            query = query.Where(t => t.TicketStatusId == statusId);

        if (model.AssignedTo.HasValue)
            query = query.Where(t => t.AssignedToId == model.AssignedTo.Value);

        if (!string.IsNullOrEmpty(model.Type) && Enum.TryParse(model.Type, true, out TicketType type))
            query = query.Where(t => t.Type == type);

        if (!string.IsNullOrWhiteSpace(model.Search))
        {
            string pattern = SearchPattern.Like(model.Search);
            IQueryable<TicketComment> comments = commentRepository.GetAll(QueryableQueryOptions.ReadOnly);

            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern) ||
                comments.Any(c => c.TicketId == t.Id && EF.Functions.ILike(c.Content, pattern)));
        }

        return query;
    }
}
