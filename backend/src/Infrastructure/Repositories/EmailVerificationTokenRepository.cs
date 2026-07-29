using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class EmailVerificationTokenRepository
    : CrudEntityWithIdRepository<EmailVerificationToken>, IEmailVerificationTokenRepository
{
    public EmailVerificationTokenRepository(SentinelContext context) : base(context) { }

    public Task<EmailVerificationToken?> GetOrDefaultValidByTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow,
                cancellationToken);

    public Task InvalidatePendingAsync(string email, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .Where(t => t.Email == email.ToLower() && !t.IsUsed)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsUsed, true), cancellationToken);
}
