using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class UserRepository : CrudEntityWithIdRepository<User>, IUserRepository
{
    public UserRepository(SentinelContext context) : base(context) { }

    public Task<User?> GetOrDefaultByEmailAsync(string email, SingleEntityQueryOptions<User> options,
        CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(u => u.Email == email.ToLower(), cancellationToken);

    public Task<User?> GetOrDefaultActiveByEmailAsync(string email, SingleEntityQueryOptions<User> options,
        CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(u => u.Email == email.ToLower() && u.IsActive, cancellationToken);

    public Task<User?> GetOrDefaultActiveAsync(Guid userId, SingleEntityQueryOptions<User> options,
        CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);

    public Task<User?> GetOrDefaultInOrganizationAsync(Guid userId, Guid organizationId,
        SingleEntityQueryOptions<User> options, CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId, cancellationToken);

    public Task<User?> GetOrDefaultByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .FirstOrDefaultAsync(u =>
                u.RefreshToken == tokenHash
                && u.RefreshTokenExpiry > DateTime.UtcNow
                && u.IsActive, cancellationToken);

    public Task<User?> GetOrDefaultByPreviousRefreshTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .FirstOrDefaultAsync(u => u.PreviousRefreshTokenHash == tokenHash && u.IsActive, cancellationToken);

    public IQueryable<User> GetActiveByEmail(string email, QueryableQueryOptions options) =>
        GetAll(options).Where(u => u.Email == email.ToLower() && u.IsActive);

    public IQueryable<User> GetByOrganization(Guid organizationId, QueryableQueryOptions options) =>
        GetAll(options).Where(u => u.OrganizationId == organizationId);

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly).AnyAsync(u => u.Email == email.ToLower(), cancellationToken);

    public Task<bool> ExistsByEmailInOrganizationAsync(string email, Guid organizationId,
        CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .AnyAsync(u => u.Email == email.ToLower() && u.OrganizationId == organizationId, cancellationToken);

    public Task<int> CountActiveAsync(Guid organizationId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .CountAsync(u => u.OrganizationId == organizationId && u.IsActive, cancellationToken);

    public Task<List<string>> GetActiveAdminEmailsAsync(Guid organizationId, CancellationToken cancellationToken) =>
        ActiveAdmins(organizationId).Select(u => u.Email).ToListAsync(cancellationToken);

    public Task<string?> GetOldestActiveAdminEmailAsync(Guid organizationId, CancellationToken cancellationToken) =>
        ActiveAdmins(organizationId)
            .OrderBy(u => u.CreatedAt)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(cancellationToken);

    private IQueryable<User> ActiveAdmins(Guid organizationId) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .Where(u => u.OrganizationId == organizationId && u.Role == UserRole.Admin && u.IsActive);

    public Task<int> CountActiveAdminsAsync(Guid organizationId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .CountAsync(u => u.OrganizationId == organizationId && u.Role == UserRole.Admin && u.IsActive,
                cancellationToken);
}
