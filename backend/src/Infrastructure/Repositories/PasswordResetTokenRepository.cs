using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class PasswordResetTokenRepository
    : CrudEntityWithIdRepository<PasswordResetToken>, IPasswordResetTokenRepository
{
    public PasswordResetTokenRepository(SentinelContext context) : base(context) { }

    public Task<PasswordResetToken?> GetOrDefaultValidByTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow,
                cancellationToken);

    public Task InvalidatePendingAsync(string email, CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(t => t.Email == email.ToLowerInvariant() && !t.IsUsed)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsUsed, true), cancellationToken);
}
