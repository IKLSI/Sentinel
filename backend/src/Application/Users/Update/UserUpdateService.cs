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

namespace Sentinel.Application.Users.Update;

public class UserUpdateService(
    IUserRepository userRepository,
    IApiKeyRepository apiKeyRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IAuditLogService auditLog,
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
            new SingleEntityQueryOptions<User>(), cancellationToken);

        if (user == null)
            return Result<UserDto>.NotFound(ErrorCodes.UserNotFound);

        if (!string.IsNullOrEmpty(model.FirstName)) user.FirstName = model.FirstName;
        if (!string.IsNullOrEmpty(model.LastName)) user.LastName = model.LastName;

        UserRole originalRole = user.Role;
        bool willDeactivate = model.IsActive.HasValue && !model.IsActive.Value;
        bool willDemote = !string.IsNullOrEmpty(model.Role)
            && Enum.TryParse(model.Role, true, out UserRole parsedRole)
            && parsedRole != UserRole.Admin
            && user.Role == UserRole.Admin;

        if (userId == currentUserId && (willDeactivate || willDemote))
        {
            int activeAdmins = await userRepository.CountActiveAdminsAsync(organizationId, cancellationToken);

            if (activeAdmins <= 1)
                return Result<UserDto>.Error(ErrorCodes.UserLastAdminRequired);
        }

        if (model.IsActive.HasValue) user.IsActive = model.IsActive.Value;

        if (!string.IsNullOrEmpty(model.Role))
        {
            if (!Enum.TryParse(model.Role, true, out UserRole role))
                return Result<UserDto>.Error(ErrorCodes.UserInvalidRole);

            user.Role = role;
        }

        if (user.Role != originalRole || willDeactivate) user.TokenVersion++;

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            await unitOfWork.CommitAsync(cancellationToken);
        }

        if (willDeactivate)
            await apiKeyRepository.RevokeAllForUserAsync(user.Id, cancellationToken);

        await auditLog.LogAsync(
            AuditAction.UserUpdated,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId,
            userId: currentUserId,
            entityId: userId,
            jti: tenant.Jti);

        return UserMapper.ToDto(user);
    }
}
