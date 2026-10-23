using Sentinel.Application.Security;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Audit;
using Sentinel.Application.Jobs;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Update;

public class UserUpdateService(
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IApiKeyRepository apiKeyRepository,
    IPasswordResetTokenRepository passwordResetTokenRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    DashboardCache dashboardCache,
    IJobScheduler jobs,
    UserSessionCache userSessionCache,
    ITenantContext tenant,
    UserUpdateValidator validator) : IService
{
    public async Task<Result<UserDto>> ExecuteAsync(Guid userId, UpdateUserDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<UserDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result<UserDto>.Unauthorized();

        User? user = await userRepository.GetOrDefaultInOrganizationAsync(userId, organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (user == null)
            return Result<UserDto>.NotFound(ErrorCodes.UserNotFound);

        UserRole originalRole = user.Role;
        UserRole? newRole = null;

        if (!string.IsNullOrEmpty(model.Role))
        {
            if (!EnumValue.TryParse(model.Role, out UserRole parsedRole))
                return Result<UserDto>.Error(ErrorCodes.UserInvalidRole);

            newRole = parsedRole;
        }

        UserAccessStatus? newAccessStatus = null;

        if (!string.IsNullOrEmpty(model.AccessStatus))
        {
            if (!EnumValue.TryParse(model.AccessStatus, out UserAccessStatus parsedAccessStatus))
                return Result<UserDto>.Error(ErrorCodes.UserInvalidAccessStatus);

            newAccessStatus = parsedAccessStatus;
        }

        bool changesAccess = (newRole.HasValue && newRole.Value != originalRole)
            || (newAccessStatus.HasValue && newAccessStatus.Value != user.AccessStatus);

        if (userId == currentUserId && changesAccess)
            return Result<UserDto>.Error(ErrorCodes.UserCannotChangeOwnAccess);

        bool willSuspend = newAccessStatus == UserAccessStatus.Suspended;

        bool suspensionTransition = willSuspend && user.AccessStatus == UserAccessStatus.Active;

        bool invalidatesSessions = (newRole.HasValue && newRole.Value != originalRole) || willSuspend;

        User? updatedUser = null;
        bool lastAdminBlocked = false;

        await commitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            User? tracked = await userRepository.GetOrDefaultInOrganizationAsync(userId, organizationId,
                QueryTracking.Tracked, token);

            if (tracked == null) return;

            bool wasActiveAdmin = tracked.Role == UserRole.Admin && tracked.AccessStatus == UserAccessStatus.Active;
            bool staysActiveAdmin = (newRole ?? tracked.Role) == UserRole.Admin
                && (newAccessStatus ?? tracked.AccessStatus) == UserAccessStatus.Active;

            if (wasActiveAdmin && !staysActiveAdmin)
            {
                await organizationRepository.LockForUpdateAsync(organizationId, token);

                int remainingAdmins = await userRepository
                    .CountActiveAdminsExcludingAsync(organizationId, userId, token);

                if (remainingAdmins == 0)
                {
                    lastAdminBlocked = true;
                    return;
                }
            }

            if (!string.IsNullOrEmpty(model.FirstName)) tracked.FirstName = model.FirstName;
            if (!string.IsNullOrEmpty(model.LastName)) tracked.LastName = model.LastName;
            if (newAccessStatus.HasValue) tracked.AccessStatus = newAccessStatus.Value;
            if (newRole.HasValue) tracked.Role = newRole.Value;
            if (invalidatesSessions) tracked.TokenVersion++;

            if (willSuspend)
            {
                await apiKeyRepository.RevokeAllForUserAsync(userId, token);
                await passwordResetTokenRepository.InvalidatePendingForUserAsync(userId, token);
            }

            updatedUser = tracked;
        }, cancellationToken);

        if (lastAdminBlocked)
            return Result<UserDto>.Error(ErrorCodes.UserLastAdminRequired);

        if (updatedUser == null)
            return Result<UserDto>.NotFound(ErrorCodes.UserNotFound);

        if (invalidatesSessions)
            await userSessionCache.InvalidateAsync(userId, cancellationToken);

        if (suspensionTransition)
            jobs.Enqueue<SendAccountSuspendedEmailJob>(JobQueues.Emails, j => j.ExecuteAsync(userId,
                CancellationToken.None));

        dashboardCache.Invalidate(organizationId);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Users));

        await auditLog.LogAsync(
            AuditAction.UserUpdated,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId,
            userId: currentUserId,
            entityId: userId,
            jti: tenant.Jti);

        return UserMapper.ToDto(updatedUser);
    }
}
