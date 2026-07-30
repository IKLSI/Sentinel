using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IUserRepository : ICrudEntityWithIdRepository<User>
{
    Task<User?> GetOrDefaultByEmailAsync(string email, QueryTracking tracking, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveAsync(Guid userId, QueryTracking tracking, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveWithOrganizationAsync(Guid userId, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultInOrganizationAsync(Guid userId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<User?> GetOrDefaultByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultByPreviousRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task<IReadOnlyList<User>> ListActiveByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<PagedList<User>> SearchInOrganizationAsync(Guid organizationId, string? search, int page, int pageSize,
        CancellationToken cancellationToken);

    Task<string?> GetLanguageOrDefaultAsync(Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListAdminEmailsAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<bool> ExistsByEmailInOrganizationAsync(string email, Guid organizationId, CancellationToken cancellationToken);

    Task<bool> ExistsByEmailAcrossTenantsAsync(string email, CancellationToken cancellationToken);

    Task<int> CountActiveAdminsExcludingAsync(Guid organizationId, Guid excludedUserId,
        CancellationToken cancellationToken);

    Task<int> CountActiveAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<List<string>> GetActiveAdminEmailsAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<string?> GetOldestActiveAdminEmailAsync(Guid organizationId, CancellationToken cancellationToken);
}
