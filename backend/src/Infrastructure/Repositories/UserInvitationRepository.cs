using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class UserInvitationRepository : CrudEntityWithIdRepository<UserInvitation>, IUserInvitationRepository
{
    public UserInvitationRepository(SentinelContext context) : base(context) { }

    public Task<UserInvitation?> GetOrDefaultPendingByTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.Tracked)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public Task<int> CountPendingAsync(Guid organizationId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .CountAsync(i => i.OrganizationId == organizationId
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public Task<bool> ExistsPendingAsync(string email, Guid organizationId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .AnyAsync(i => i.Email == email.ToLower()
                && i.OrganizationId == organizationId
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTime.UtcNow, cancellationToken);
}
