using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface IEmailVerificationTokenRepository : ICrudEntityWithIdRepository<EmailVerificationToken>
{
    Task<EmailVerificationToken?> GetOrDefaultValidByTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken);

    Task InvalidatePendingAsync(string email, CancellationToken cancellationToken);
}
