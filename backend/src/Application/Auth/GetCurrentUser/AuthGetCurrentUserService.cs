using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.GetCurrentUser;

public class AuthGetCurrentUserService(IUserRepository userRepository, ITenantContext tenant) : IService
{
    public async Task<Result<UserProfile>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid userId || userId == Guid.Empty)
            return Result<UserProfile>.Unauthorized();

        User? user = await userRepository.GetOrDefaultActiveWithOrganizationAsync(userId, cancellationToken);

        if (user == null || user.Id == Guid.Empty)
            return Result<UserProfile>.NotFound(ErrorCodes.UserNotFound);

        return UserProfileMapper.ToProfile(user);
    }
}
