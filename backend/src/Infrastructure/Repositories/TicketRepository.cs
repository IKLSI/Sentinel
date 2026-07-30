using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
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

    public async Task<PagedList<Ticket>> SearchAsync(Guid organizationId, TicketFilter filter, int page,
        int pageSize, CancellationToken cancellationToken)
    {
        IQueryable<Ticket> query = ApplyFilter(GridQuery(organizationId), filter);

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

        List<Ticket> items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedList<Ticket>(items, totalCount);
    }

    public async Task<IReadOnlyList<Ticket>> ListForExportAsync(Guid organizationId, TicketFilter filter,
        CancellationToken cancellationToken)
    {
        IQueryable<Ticket> query = ApplyFilter(GridQuery(organizationId), filter);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string pattern = SearchPattern.Like(filter.Search);

            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern));
        }

        return await query.OrderByDescending(t => t.CreatedAt).ToListAsync(cancellationToken);
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

    private IQueryable<Ticket> GridQuery(Guid organizationId) =>
        Query(QueryTracking.NoTracking)
            .Where(t => t.OrganizationId == organizationId)
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy);

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
