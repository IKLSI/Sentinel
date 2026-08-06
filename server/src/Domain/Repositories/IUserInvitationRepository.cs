using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface IUserInvitationRepository : ICrudEntityWithIdRepository<UserInvitation>
{
    Task<UserInvitation?> GetOrDefaultWithOrganizationAndInviterAsync(Guid invitationId,
        CancellationToken cancellationToken);

    Task<UserInvitation?> GetOrDefaultPendingByTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task<bool> ExistsPendingAsync(string email, Guid organizationId, CancellationToken cancellationToken);

    Task<int> CountPendingAsync(Guid organizationId, CancellationToken cancellationToken);
}
