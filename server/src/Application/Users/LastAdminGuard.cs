using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users;

public class LastAdminGuard(IOrganizationRepository organizationRepository, IUserRepository userRepository)
{
    public async Task<bool> IsLastActiveAdminAsync(Guid organizationId, Guid userId,
        CancellationToken cancellationToken)
    {
        await organizationRepository.LockForUpdateAsync(organizationId, cancellationToken);

        return await userRepository.CountActiveAdminsExcludingAsync(organizationId, userId, cancellationToken) == 0;
    }
}
