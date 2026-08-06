using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IRevokedTokenRepository : ICrudEntityWithIdRepository<RevokedToken>
{
    Task<bool> ExistsByJtiAsync(string jti, CancellationToken cancellationToken);

    Task RevokeAsync(string jti, DateTime expiresAt, CancellationToken cancellationToken);

    Task<int> DeleteExpiredAsync(CancellationToken cancellationToken);
}
