using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IPasswordResetTokenRepository : ICrudEntityWithIdRepository<PasswordResetToken>
{
    Task<PasswordResetToken?> GetOrDefaultValidByTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task InvalidatePendingAsync(string email, CancellationToken cancellationToken);

    Task InvalidatePendingForUserAsync(Guid userId, CancellationToken cancellationToken);
}
