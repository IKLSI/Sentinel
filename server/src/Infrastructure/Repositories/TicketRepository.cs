using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketRepository : CrudEntityWithIdRepository<Ticket>, ITicketRepository
{
    public TicketRepository(SentinelContext context) : base(context) { }

    public Task<TicketDetailRow?> GetOrDefaultDetailAsync(Guid ticketId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AsSplitQuery()
            .Where(t => t.Id == ticketId)
            .Select(ToDetailRow)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<PagedList<TicketGridRow>> SearchAsync(Guid organizationId, TicketFilter filter,
        TicketSortField sortBy, SortDirection sortDirection, int page, int pageSize,
        CancellationToken cancellationToken)
    {
        IQueryable<Ticket> query = ApplySearch(ApplyFilter(FilteredQuery(organizationId), filter), filter.Search);

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

    public async Task<IReadOnlyList<TicketExportRow>> ListForExportAsync(Guid organizationId, TicketFilter filter,
        int maxRows, CancellationToken cancellationToken)
    {
        IQueryable<Ticket> query = ApplySearch(ApplyFilter(FilteredQuery(organizationId), filter), filter.Search);

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(maxRows)
            .Select(ToExportRow)
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

    private IQueryable<Ticket> ApplySearch(IQueryable<Ticket> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search)) return query;

        string pattern = SearchPattern.Like(search);
        IQueryable<TicketComment> comments = Context.TicketComments.AsNoTracking();

        return query.Where(t =>
            EF.Functions.ILike(t.Title, pattern) ||
            EF.Functions.ILike(t.Description, pattern) ||
            comments.Any(c => c.TicketId == t.Id && EF.Functions.ILike(c.Content, pattern)));
    }

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
            TicketSortField.Title => query.OrderBy(t => t.Title, descending),
            TicketSortField.Status => query.OrderBy(StatusRank, descending),
            TicketSortField.Assignee => query.OrderBy(t => t.AssignedTo == null)
                .ThenBy(t => t.AssignedTo!.FirstName, descending)
                .ThenBy(t => t.AssignedTo!.LastName, descending),
            TicketSortField.Comments => query.OrderBy(t => t.Comments.Count, descending),
            _ => query.OrderBy(t => t.PriorityRank, descending)
        };
    }

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

    private static readonly Expression<Func<Ticket, TicketDetailRow>> ToDetailRow = t => new TicketDetailRow(
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
        t.FindingKind,
        t.FindingKey,
        t.Comments
            .OrderBy(c => c.CreatedAt)
            .Select(c => new TicketCommentRow(c.Id, c.AuthorId, c.Author.FirstName, c.Author.LastName, c.Content,
                c.CreatedAt))
            .ToList(),
        t.History
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new TicketHistoryRow(
                h.Id,
                h.User != null ? h.User.FirstName : null,
                h.User != null ? h.User.LastName : null,
                h.Field,
                h.OldValue,
                h.NewValue,
                h.CreatedAt))
            .ToList());

    private static readonly Expression<Func<Ticket, TicketExportRow>> ToExportRow = t => new TicketExportRow(
        t.Number,
        t.Project != null ? t.Project.Name : null,
        t.Title,
        t.Priority,
        t.Type,
        t.Status,
        t.AssignedTo != null ? t.AssignedTo.FirstName : null,
        t.AssignedTo != null ? t.AssignedTo.LastName : null,
        t.CreatedBy != null ? t.CreatedBy.FirstName : null,
        t.CreatedBy != null ? t.CreatedBy.LastName : null,
        t.CreatedAt,
        t.UpdatedAt);
}
