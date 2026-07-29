using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.DeleteAccount;

public class UserDeleteAccountService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IAuditLogRepository auditLogRepository,
    INotificationRepository notificationRepository,
    IApiKeyRepository apiKeyRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IAuditLogService auditLog,
    ITenantContext tenant) : IService
{

    public async Task<Result> ExecuteAsync(DeleteAccountDto model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result.Unauthorized();

        User? user = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
            new SingleEntityQueryOptions<User>(), cancellationToken);

        if (user == null)
            return Result.NotFound(ErrorCodes.UserNotFound);

        if (!passwordHasher.Verify(model.Password, user.PasswordHash))
            return Result.Error(ErrorCodes.UserWrongPassword);

        if (user.Role == UserRole.Admin)
        {
            int activeAdmins = await userRepository.CountActiveAdminsAsync(organizationId, cancellationToken);

            if (activeAdmins <= 1)
                return Result.Error(ErrorCodes.UserCannotDeleteLastAdmin);
        }

        await auditLogRepository.DetachUserAsync(currentUserId, cancellationToken);
        await notificationRepository.DeleteByUserAsync(currentUserId, cancellationToken);

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            Anonymize(user);
            await unitOfWork.CommitAsync(cancellationToken);
        }

        await apiKeyRepository.RevokeAllForUserAsync(user.Id, cancellationToken);

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
        user.IsActive = false;
        user.TokenVersion++;
    }
}
