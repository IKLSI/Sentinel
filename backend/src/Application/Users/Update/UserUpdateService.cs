using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Update;

public class UserUpdateService(
    IUserRepository userRepository,
    IApiKeyRepository apiKeyRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IMemoryCache cache,
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
            if (!Enum.TryParse(model.Role, true, out UserRole parsedRole))
                return Result<UserDto>.Error(ErrorCodes.UserInvalidRole);

            newRole = parsedRole;
        }

        bool willDeactivate = model.IsActive.HasValue && !model.IsActive.Value;
        bool willDemote = newRole.HasValue && newRole.Value != UserRole.Admin && originalRole == UserRole.Admin;

        if (userId == currentUserId && (willDeactivate || willDemote))
        {
            int activeAdmins = await userRepository.CountActiveAdminsAsync(organizationId, cancellationToken);

            if (activeAdmins <= 1)
                return Result<UserDto>.Error(ErrorCodes.UserLastAdminRequired);
        }

        bool invalidatesSessions = (newRole.HasValue && newRole.Value != originalRole) || willDeactivate;

        User? updatedUser = null;

        await commitScopeFactory.ExecuteInTransactionAsync(async token =>
        {
            User? tracked = await userRepository.GetOrDefaultInOrganizationAsync(userId, organizationId,
                QueryTracking.Tracked, token);

            if (tracked == null) return;

            if (!string.IsNullOrEmpty(model.FirstName)) tracked.FirstName = model.FirstName;
            if (!string.IsNullOrEmpty(model.LastName)) tracked.LastName = model.LastName;
            if (model.IsActive.HasValue) tracked.IsActive = model.IsActive.Value;
            if (newRole.HasValue) tracked.Role = newRole.Value;
            if (invalidatesSessions) tracked.TokenVersion++;

            if (willDeactivate)
                await apiKeyRepository.RevokeAllForUserAsync(userId, token);

            updatedUser = tracked;
        }, cancellationToken);

        if (updatedUser == null)
            return Result<UserDto>.NotFound(ErrorCodes.UserNotFound);

        if (invalidatesSessions)
            cache.Remove(CacheKeys.AuthAccount(userId));

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
