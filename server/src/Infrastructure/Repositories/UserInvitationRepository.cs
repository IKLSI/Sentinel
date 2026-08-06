using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class UserInvitationRepository : CrudEntityWithIdRepository<UserInvitation>, IUserInvitationRepository
{
    public UserInvitationRepository(SentinelContext context) : base(context) { }

    public Task<UserInvitation?> GetOrDefaultWithOrganizationAndInviterAsync(Guid invitationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .Include(i => i.Organization)
            .Include(i => i.InvitedBy)
            .FirstOrDefaultAsync(i => i.Id == invitationId, cancellationToken);

    public Task<UserInvitation?> GetOrDefaultPendingByTokenHashAsync(string tokenHash,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public Task<int> CountPendingAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .CountAsync(i => i.OrganizationId == organizationId
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public Task<bool> ExistsPendingAsync(string email, Guid organizationId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking)
            .AnyAsync(i => i.Email == email.ToLowerInvariant()
                && i.OrganizationId == organizationId
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTime.UtcNow, cancellationToken);
}
