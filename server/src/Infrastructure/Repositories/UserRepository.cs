using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class UserRepository : CrudEntityWithIdRepository<User>, IUserRepository
{
    public UserRepository(SentinelContext context) : base(context) { }

    public Task<User?> GetOrDefaultByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking).FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), cancellationToken);

    public Task<User?> GetOrDefaultActiveByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking).FirstOrDefaultAsync(
            u => u.Email == email.ToLowerInvariant() && u.AccessStatus == UserAccessStatus.Active, cancellationToken);

    public Task<User?> GetOrDefaultActiveAsync(Guid userId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking).FirstOrDefaultAsync(u => u.Id == userId && u.AccessStatus == UserAccessStatus.Active, cancellationToken);

    public Task<User?> GetOrDefaultActiveWithOrganizationAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId && u.AccessStatus == UserAccessStatus.Active, cancellationToken);

    public Task<User?> GetOrDefaultWithOrganizationAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

    public Task<User?> GetOrDefaultInOrganizationAsync(Guid userId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking)
            .FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId, cancellationToken);

    public Task<User?> GetOrDefaultByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(u =>
                u.RefreshToken == tokenHash
                && u.RefreshTokenExpiry > DateTime.UtcNow
                && u.AccessStatus == UserAccessStatus.Active, cancellationToken);

    public Task<User?> GetOrDefaultByPreviousRefreshTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(
                u => u.PreviousRefreshTokenHash == tokenHash && u.AccessStatus == UserAccessStatus.Active,
                cancellationToken);

    public async Task<IReadOnlyList<User>> ListActiveByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        await Query(tracking)
            .Where(u => u.Email == email.ToLowerInvariant() && u.AccessStatus == UserAccessStatus.Active)
            .ToListAsync(cancellationToken);

    public async Task<PagedList<UserGridRow>> SearchInOrganizationAsync(Guid organizationId, UserFilter filter,
        UserSortField sortBy, SortDirection sortDirection, int page, int pageSize,
        CancellationToken cancellationToken)
    {
        IQueryable<User> query = Query(QueryTracking.NoTracking)
            .Where(u => u.OrganizationId == organizationId);

        if (filter.Roles.Count > 0)
        {
            List<UserRole> roles = [.. filter.Roles];
            query = query.Where(u => roles.Contains(u.Role));
        }

        if (filter.Statuses.Count > 0)
        {
            List<UserAccessStatus> statuses = [.. filter.Statuses];
            query = query.Where(u => statuses.Contains(u.AccessStatus));
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string pattern = SearchPattern.Like(filter.Search);

            query = query.Where(u =>
                EF.Functions.ILike(u.FirstName, pattern) ||
                EF.Functions.ILike(u.LastName, pattern) ||
                EF.Functions.ILike(u.Email, pattern));
        }

        int total = await query.CountAsync(cancellationToken);

        List<UserGridRow> users = await ApplySort(query, sortBy, sortDirection)
            .ThenBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToGridRow)
            .ToListAsync(cancellationToken);

        return new PagedList<UserGridRow>(users, total);
    }

    private static readonly Expression<Func<User, int>> RoleRank = u => u.Role == UserRole.Admin ? 0 : 1;

    internal static IOrderedQueryable<User> ApplySort(IQueryable<User> query, UserSortField sortBy,
        SortDirection sortDirection)
    {
        bool descending = sortDirection == SortDirection.Desc;

        return sortBy switch
        {
            UserSortField.Role => descending
                ? query.OrderByDescending(RoleRank)
                : query.OrderBy(RoleRank),
            UserSortField.Status => descending
                ? query.OrderByDescending(u => u.AccessStatus == UserAccessStatus.Active)
                : query.OrderBy(u => u.AccessStatus == UserAccessStatus.Active),
            UserSortField.LastLogin => descending
                ? query.OrderBy(u => u.LastLoginAt == null).ThenByDescending(u => u.LastLoginAt)
                : query.OrderBy(u => u.LastLoginAt == null).ThenBy(u => u.LastLoginAt),
            _ => descending
                ? query.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName)
                : query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
        };
    }

    private static readonly Expression<Func<User, UserGridRow>> ToGridRow = u => new UserGridRow(
        u.Id,
        u.Email,
        u.FirstName,
        u.LastName,
        u.Role,
        u.AccessStatus,
        u.CreatedAt,
        u.LastLoginAt,
        u.Theme,
        u.Language);

    public Task<string?> GetLanguageOrDefaultAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(u => u.Id == userId)
            .Select(u => u.Language)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<string?> GetLanguageByEmailOrDefaultAsync(string email, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .IgnoreQueryFilters()
            .Where(u => u.Email == email.ToLowerInvariant())
            .Select(u => u.Language)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<EmailRecipient>> ListAdminRecipientsAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(u => u.OrganizationId == organizationId)
            .Where(u => u.Role == UserRole.Admin)
            .Select(u => new EmailRecipient(u.Email, u.Language))
            .ToListAsync(cancellationToken);

    public Task<bool> ExistsByEmailInOrganizationAsync(string email, Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AnyAsync(u => u.Email == email.ToLowerInvariant() && u.OrganizationId == organizationId, cancellationToken);

    public Task<bool> ExistsByEmailAcrossTenantsAsync(string email, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == email.ToLowerInvariant(), cancellationToken);

    public Task<int> CountActiveAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .CountAsync(u => u.OrganizationId == organizationId && u.AccessStatus == UserAccessStatus.Active, cancellationToken);

    public Task<List<EmailRecipient>> GetActiveAdminRecipientsAsync(Guid organizationId, CancellationToken cancellationToken) =>
        ActiveAdmins(organizationId)
            .Select(u => new EmailRecipient(u.Email, u.Language))
            .ToListAsync(cancellationToken);

    public Task<string?> GetOldestActiveAdminEmailAsync(Guid organizationId, CancellationToken cancellationToken) =>
        ActiveAdmins(organizationId)
            .OrderBy(u => u.CreatedAt)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<int> CountActiveAdminsExcludingAsync(Guid organizationId, Guid excludedUserId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .CountAsync(u => u.OrganizationId == organizationId && u.Role == UserRole.Admin && u.AccessStatus == UserAccessStatus.Active
                && u.Id != excludedUserId, cancellationToken);

    private IQueryable<User> ActiveAdmins(Guid organizationId) =>
        Query(QueryTracking.NoTracking)
            .Where(u => u.OrganizationId == organizationId && u.Role == UserRole.Admin && u.AccessStatus == UserAccessStatus.Active);
}
