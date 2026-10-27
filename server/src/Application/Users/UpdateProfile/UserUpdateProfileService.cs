using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.UpdateProfile;

public class UserUpdateProfileService(
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    UserUpdateProfileValidator validator) : IService
{
    public async Task<Result<UserDto>> ExecuteAsync(UpdateMyProfileDto model, CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<UserDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result<UserDto>.Unauthorized();

        User? user = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (user == null)
            return Result<UserDto>.NotFound(ErrorCodes.UserNotFound);

        if (!string.IsNullOrEmpty(model.FirstName)) user.FirstName = model.FirstName;
        if (!string.IsNullOrEmpty(model.LastName)) user.LastName = model.LastName;

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Users));

        await auditLog.LogAsync(
            AuditAction.ProfileUpdated,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId,
            userId: currentUserId,
            entityId: currentUserId,
            jti: tenant.Jti);

        return UserMapper.ToDto(user);
    }
}
