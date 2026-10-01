using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
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
            TicketSortField.Comments => descending
                ? query.OrderByDescending(t => t.Comments.Count)
                : query.OrderBy(t => t.Comments.Count),
            _ => descending
                ? query.OrderByDescending(PriorityRank)
                : query.OrderBy(PriorityRank)
        };
    }

    private static readonly Expression<Func<Ticket, TicketGridRow>> ToGridRow = t => new TicketGridRow(
        t.Id,
        t.Number,
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
        t.CreatedBy != null ? t.CreatedBy.FirstName : null,
        t.CreatedBy != null ? t.CreatedBy.LastName : null,
        t.CreatedAt,
        t.UpdatedAt,
        t.Comments.Count);

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

    public async Task<IReadOnlyList<UserExportTicketRow>> ListForUserDataExportAsync(Guid userId, int take,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(t => t.CreatedById == userId || t.AssignedToId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(take)
            .Select(t => new UserExportTicketRow(
                t.Id,
                t.Number,
                t.Title,
                t.Description,
                t.Status,
                t.Priority,
                t.Type,
                t.Project != null ? t.Project.Name : null,
                t.CreatedById == userId,
                t.AssignedToId == userId,
                t.CreatedAt,
                t.UpdatedAt))
            .ToListAsync(cancellationToken);

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

    public Task<Ticket?> GetOpenForFindingAsync(Guid projectId, FindingKind kind, string findingKey,
        CancellationToken cancellationToken)
    {
        List<TicketStatus> openStatuses = [.. TicketStatusRules.Open];

        return Query(QueryTracking.NoTracking)
            .FirstOrDefaultAsync(t => t.ProjectId == projectId
                && t.FindingKind == kind
                && t.FindingKey == findingKey
                && openStatuses.Contains(t.Status), cancellationToken);
    }

    public async Task<IReadOnlyList<FindingTicketRow>> ListFindingLinksByProjectAsync(Guid projectId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(t => t.ProjectId == projectId && t.FindingKind != null && t.FindingKey != null)
            .Select(t => new FindingTicketRow(t.FindingKind!.Value, t.FindingKey!, t.Id, t.Number, t.Status,
                t.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Ticket>> ListFindingLinkedByProjectAsync(Guid projectId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        await Query(tracking)
            .Where(t => t.ProjectId == projectId && t.FindingKind != null && t.FindingKey != null)
            .ToListAsync(cancellationToken);

    private IQueryable<Ticket> FilteredQuery(Guid organizationId) =>
        Query(QueryTracking.NoTracking)
            .Where(t => t.OrganizationId == organizationId);

    private static IQueryable<Ticket> ApplyFilter(IQueryable<Ticket> query, TicketFilter filter)
    {
        if (!filter.Priority.IsEmpty)
        {
            List<TicketPriority> priorities = [.. filter.Priority.Values];
            query = query.Where(t => priorities.Contains(t.Priority));
        }

        if (!filter.Status.IsEmpty)
        {
            List<TicketStatus> statuses = [.. filter.Status.Values];
            query = query.Where(t => statuses.Contains(t.Status));
        }

        if (!filter.Type.IsEmpty)
        {
            List<TicketType> types = [.. filter.Type.Values];
            query = query.Where(t => types.Contains(t.Type));
        }

        if (!filter.AssignedTo.IsEmpty)
        {
            List<Guid> assigneeIds = [.. filter.AssignedTo.Ids];
            bool includeUnassigned = filter.AssignedTo.IncludeUnset;

            query = query.Where(t => (t.AssignedToId != null && assigneeIds.Contains(t.AssignedToId.Value))
                || (includeUnassigned && t.AssignedToId == null));
        }

        if (!filter.Project.IsEmpty)
        {
            List<Guid> projectIds = [.. filter.Project.Ids];
            bool includeWithoutProject = filter.Project.IncludeUnset;

            query = query.Where(t => (t.ProjectId != null && projectIds.Contains(t.ProjectId.Value))
                || (includeWithoutProject && t.ProjectId == null));
        }

        return query;
    }
}
