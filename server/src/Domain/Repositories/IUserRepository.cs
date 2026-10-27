using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IUserRepository : ICrudEntityWithIdRepository<User>
{
    Task<User?> GetOrDefaultByEmailAsync(string email, QueryTracking tracking, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveAsync(Guid userId, QueryTracking tracking, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveWithOrganizationAsync(Guid userId, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultWithOrganizationAsync(Guid userId, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultInOrganizationAsync(Guid userId, Guid organizationId, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<User?> GetOrDefaultByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultByPreviousRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task<IReadOnlyList<User>> ListActiveByEmailAsync(string email, QueryTracking tracking,
        CancellationToken cancellationToken);

    Task<PagedList<UserGridRow>> SearchInOrganizationAsync(Guid organizationId, UserFilter filter,
        UserSortField sortBy, SortDirection sortDirection, int page, int pageSize,
        CancellationToken cancellationToken);

    Task<string?> GetLanguageOrDefaultAsync(Guid userId, CancellationToken cancellationToken);

    Task<string?> GetFullNameOrDefaultAsync(Guid userId, CancellationToken cancellationToken);

    Task<string?> GetLanguageByEmailOrDefaultAsync(string email, CancellationToken cancellationToken);

    Task<IReadOnlyList<EmailRecipient>> ListAdminRecipientsAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<IReadOnlyList<UserOptionRow>> ListOptionsByNameAsync(Guid organizationId,
        CancellationToken cancellationToken);

    Task<UserAccountStateRow?> GetAccountStateOrDefaultAsync(Guid userId, CancellationToken cancellationToken);

    Task<bool> ExistsInOrganizationAsync(Guid userId, Guid organizationId, CancellationToken cancellationToken);

    Task<bool> ExistsByEmailInOrganizationAsync(string email, Guid organizationId, CancellationToken cancellationToken);

    Task<bool> ExistsByEmailAcrossTenantsAsync(string email, CancellationToken cancellationToken);

    Task<int> CountActiveAdminsExcludingAsync(Guid organizationId, Guid excludedUserId,
        CancellationToken cancellationToken);
}
