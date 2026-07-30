using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
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
        Query(tracking).FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant() && u.IsActive, cancellationToken);

    public Task<User?> GetOrDefaultActiveAsync(Guid userId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking).FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);

    public Task<User?> GetOrDefaultActiveWithOrganizationAsync(Guid userId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);

    public Task<User?> GetOrDefaultInOrganizationAsync(Guid userId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking)
            .FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId, cancellationToken);

    public Task<User?> GetOrDefaultByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(u =>
                u.RefreshToken == tokenHash
                && u.RefreshTokenExpiry > DateTime.UtcNow
                && u.IsActive, cancellationToken);

    public Task<User?> GetOrDefaultByPreviousRefreshTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(u => u.PreviousRefreshTokenHash == tokenHash && u.IsActive, cancellationToken);

    public async Task<IReadOnlyList<User>> ListActiveByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        await Query(tracking)
            .Where(u => u.Email == email.ToLowerInvariant() && u.IsActive)
            .ToListAsync(cancellationToken);

    public async Task<PagedList<User>> SearchInOrganizationAsync(Guid organizationId, string? search, int page,
        int pageSize, CancellationToken cancellationToken)
    {
        IQueryable<User> query = Query(QueryTracking.NoTracking)
            .Where(u => u.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            string pattern = SearchPattern.Like(search);

            query = query.Where(u =>
                EF.Functions.ILike(u.FirstName, pattern) ||
                EF.Functions.ILike(u.LastName, pattern) ||
                EF.Functions.ILike(u.Email, pattern));
        }

        int total = await query.CountAsync(cancellationToken);

        List<User> users = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedList<User>(users, total);
    }

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
            .CountAsync(u => u.OrganizationId == organizationId && u.IsActive, cancellationToken);

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
            .CountAsync(u => u.OrganizationId == organizationId && u.Role == UserRole.Admin && u.IsActive
                && u.Id != excludedUserId, cancellationToken);

    private IQueryable<User> ActiveAdmins(Guid organizationId) =>
        Query(QueryTracking.NoTracking)
            .Where(u => u.OrganizationId == organizationId && u.Role == UserRole.Admin && u.IsActive);
}
