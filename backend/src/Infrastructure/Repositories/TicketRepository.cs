using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketRepository : CrudEntityWithIdRepository<Ticket>, ITicketRepository
{
    public TicketRepository(SentinelContext context) : base(context) { }

    public Task<Ticket?> GetOrDefaultWithDetailsAsync(Guid ticketId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AsSplitQuery()
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .Include(t => t.History).ThenInclude(h => h.User)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

    public Task<Ticket?> GetOrDefaultTrackedAsync(Guid ticketId, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

    public async Task<PagedList<TicketGridRow>> SearchAsync(Guid organizationId, TicketFilter filter,
        TicketSortField sortBy, SortDirection sortDirection, int page, int pageSize,
        CancellationToken cancellationToken)
    {
        IQueryable<Ticket> query = ApplyFilter(FilteredQuery(organizationId), filter);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string pattern = SearchPattern.Like(filter.Search);
            IQueryable<TicketComment> comments = Context.TicketComments.AsNoTracking();

            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern) ||
                comments.Any(c => c.TicketId == t.Id && EF.Functions.ILike(c.Content, pattern)));
        }

        int totalCount = await query.CountAsync(cancellationToken);

        List<TicketGridRow> items = await ApplySort(query, sortBy, sortDirection)
            .ThenByDescending(t => t.CreatedAt)
            .ThenBy(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToGridRow)
            .ToListAsync(cancellationToken);

        return new PagedList<TicketGridRow>(items, totalCount);
    }

    private static readonly Expression<Func<Ticket, int>> PriorityRank = t =>
        t.Priority == TicketPriority.Low ? 0
        : t.Priority == TicketPriority.Medium ? 1
        : t.Priority == TicketPriority.High ? 2
        : 3;

    private static readonly Expression<Func<Ticket, int>> StatusRank = t =>
        t.Status == TicketStatus.New ? 0
        : t.Status == TicketStatus.InProgress ? 1
        : t.Status == TicketStatus.Testing ? 2
        : t.Status == TicketStatus.Resolved ? 3
        : 4;

    internal static IOrderedQueryable<Ticket> ApplySort(IQueryable<Ticket> query, TicketSortField sortBy,
        SortDirection sortDirection)
    {
        bool descending = sortDirection == SortDirection.Desc;

        return sortBy switch
        {
            TicketSortField.Title => descending
                ? query.OrderByDescending(t => t.Title)
                : query.OrderBy(t => t.Title),
            TicketSortField.Status => descending
                ? query.OrderByDescending(StatusRank)
                : query.OrderBy(StatusRank),
            TicketSortField.Assignee => descending
                ? query.OrderBy(t => t.AssignedTo == null)
                    .ThenByDescending(t => t.AssignedTo!.FirstName)
                    .ThenByDescending(t => t.AssignedTo!.LastName)
                : query.OrderBy(t => t.AssignedTo == null)
                    .ThenBy(t => t.AssignedTo!.FirstName)
                    .ThenBy(t => t.AssignedTo!.LastName),
            _ => descending
                ? query.OrderByDescending(PriorityRank)
                : query.OrderBy(PriorityRank)
        };
    }

    private static readonly Expression<Func<Ticket, TicketGridRow>> ToGridRow = t => new TicketGridRow(
        t.Id,
        t.ProjectId,
        t.Project != null ? t.Project.Name : null,
        t.Title,
        t.Description,
        t.Priority,
        t.Type,
        t.Status,
        t.AssignedToId,
        t.AssignedTo != null ? t.AssignedTo.FirstName : null,
        t.AssignedTo != null ? t.AssignedTo.LastName : null,
        t.EstimatedHours,
        t.CreatedBy != null ? t.CreatedBy.FirstName : null,
        t.CreatedBy != null ? t.CreatedBy.LastName : null,
        t.CreatedAt,
        t.UpdatedAt);

    public async Task<IReadOnlyList<TicketGridRow>> ListForExportAsync(Guid organizationId, TicketFilter filter,
        int maxRows, CancellationToken cancellationToken)
    {
        IQueryable<Ticket> query = ApplyFilter(FilteredQuery(organizationId), filter);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string pattern = SearchPattern.Like(filter.Search);
            IQueryable<TicketComment> comments = Context.TicketComments.AsNoTracking();

            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern) ||
                comments.Any(c => c.TicketId == t.Id && EF.Functions.ILike(c.Content, pattern)));
        }

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(maxRows)
            .Select(ToGridRow)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyDictionary<Guid, int>> CountByProjectsAsync(IReadOnlyCollection<Guid> projectIds,
        CancellationToken cancellationToken)
    {
        List<Guid> ids = projectIds.ToList();

        return await Query(QueryTracking.NoTracking)
            .Where(t => t.ProjectId != null && ids.Contains(t.ProjectId.Value))
            .GroupBy(t => t.ProjectId!.Value)
            .Select(g => new { ProjectId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProjectId, x => x.Count, cancellationToken);
    }

    public Task<bool> ExistsInOrganizationAsync(Guid ticketId, Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AnyAsync(t => t.Id == ticketId && t.OrganizationId == organizationId, cancellationToken);

    public Task<int> DeleteInOrganizationAsync(Guid ticketId, Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(t => t.Id == ticketId && t.OrganizationId == organizationId)
            .ExecuteDeleteAsync(cancellationToken);

    private IQueryable<Ticket> FilteredQuery(Guid organizationId) =>
        Query(QueryTracking.NoTracking)
            .Where(t => t.OrganizationId == organizationId);

    private static IQueryable<Ticket> ApplyFilter(IQueryable<Ticket> query, TicketFilter filter)
    {
        if (filter.Priority is TicketPriority priority)
            query = query.Where(t => t.Priority == priority);

        if (filter.Status is TicketStatus status)
            query = query.Where(t => t.Status == status);

        if (filter.AssignedToId is Guid assignedToId)
            query = query.Where(t => t.AssignedToId == assignedToId);

        if (filter.Type is TicketType type)
            query = query.Where(t => t.Type == type);

        return query;
    }
}
