using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IUserRepository : ICrudEntityWithIdRepository<User>
{
    Task<User?> GetOrDefaultByEmailAsync(string email, SingleEntityQueryOptions<User> options,
        CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveByEmailAsync(string email, SingleEntityQueryOptions<User> options,
        CancellationToken cancellationToken);

    Task<User?> GetOrDefaultActiveAsync(Guid userId, SingleEntityQueryOptions<User> options,
        CancellationToken cancellationToken);

    Task<User?> GetOrDefaultInOrganizationAsync(Guid userId, Guid organizationId,
        SingleEntityQueryOptions<User> options, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task<User?> GetOrDefaultByPreviousRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    IQueryable<User> GetActiveByEmail(string email, QueryableQueryOptions options);

    IQueryable<User> GetByOrganization(Guid organizationId, QueryableQueryOptions options);

    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken);

    Task<bool> ExistsByEmailInOrganizationAsync(string email, Guid organizationId, CancellationToken cancellationToken);

    Task<int> CountActiveAdminsAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<int> CountActiveAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<List<string>> GetActiveAdminEmailsAsync(Guid organizationId, CancellationToken cancellationToken);

    Task<string?> GetOldestActiveAdminEmailAsync(Guid organizationId, CancellationToken cancellationToken);
}
