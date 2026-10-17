using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.ApiKeys;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.DeleteAccount;

public class UserDeleteAccountService(
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IPasswordHasher passwordHasher,
    IAuditLogRepository auditLogRepository,
    IApiKeyRepository apiKeyRepository,
    IPasswordResetTokenRepository passwordResetTokenRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    DashboardCache dashboardCache,
    IMemoryCache cache,
    ApiKeyPrincipalCache apiKeyPrincipalCache,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(DeleteAccountDto model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result.Unauthorized();

        User? user = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (user == null)
            return Result.NotFound(ErrorCodes.UserNotFound);

        if (!passwordHasher.Verify(model.Password, user.PasswordHash))
            return Result.Error(ErrorCodes.UserWrongPassword);

        bool lastAdminBlocked = false;

        await commitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            User? tracked = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
                QueryTracking.Tracked, token);

            if (tracked == null) return;

            if (tracked.Role == UserRole.Admin && tracked.AccessStatus == UserAccessStatus.Active)
            {
                await organizationRepository.LockForUpdateAsync(organizationId, token);

                int remainingAdmins = await userRepository
                    .CountActiveAdminsExcludingAsync(organizationId, currentUserId, token);

                if (remainingAdmins == 0)
                {
                    lastAdminBlocked = true;
                    return;
                }
            }

            await auditLogRepository.DetachUserAsync(currentUserId, token);
            await apiKeyRepository.RevokeAllForUserAsync(currentUserId, token);
            await passwordResetTokenRepository.InvalidatePendingForUserAsync(currentUserId, token);

            Anonymize(tracked);
        }, cancellationToken);

        if (lastAdminBlocked)
            return Result.Error(ErrorCodes.UserCannotDeleteLastAdmin);

        cache.Remove(CacheKeys.AuthAccount(currentUserId));
        await apiKeyPrincipalCache.InvalidateForUserAsync(currentUserId, cancellationToken);

        dashboardCache.Invalidate(organizationId);

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Users));

        await auditLog.LogAsync(
            AuditAction.AccountDeleted,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId,
            entityId: currentUserId,
            jti: tenant.Jti);

        return Result.NoContent();
    }

    private static void Anonymize(User user)
    {
        user.Email = $"supprime_{user.Id}@sentinel.invalid";
        user.FirstName = "Utilisateur";
        user.LastName = "Supprimé";
        user.PasswordHash = string.Empty;
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.PreviousRefreshTokenHash = null;
        user.AccessStatus = UserAccessStatus.Suspended;
        user.TokenVersion++;
    }
}
