using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class RevokedTokenRepository : CrudEntityWithIdRepository<RevokedToken>, IRevokedTokenRepository
{
    public RevokedTokenRepository(SentinelContext context) : base(context) { }

    public Task<bool> ExistsByJtiAsync(string jti, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AnyAsync(token => token.Jti == jti && token.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public Task RevokeAsync(string jti, DateTime expiresAt, CancellationToken cancellationToken) =>
        Context.Database.ExecuteSqlAsync(
            $"""
             INSERT INTO "RevokedTokens" ("Id", "Jti", "ExpiresAt")
             VALUES ({Guid.NewGuid()}, {jti}, {expiresAt})
             ON CONFLICT ("Jti") DO NOTHING
             """,
            cancellationToken);

    public Task<int> DeleteExpiredAsync(CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Where(token => token.ExpiresAt <= DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);
}
