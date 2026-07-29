using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.AcceptInvitation;

public class UserAcceptInvitationService(
    IUserInvitationRepository invitationRepository,
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope,
    IAuditLogService auditLog,
    UserAcceptInvitationValidator validator) : IService
{
    public async Task<Result<ApiMessageResponse>> ExecuteAsync(AcceptInvitationDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        using IDisposable elevation = systemScope.Enter();

        UserInvitation? invitation = await invitationRepository
            .GetOrDefaultPendingByTokenHashAsync(SecureToken.Hash(model.Token), cancellationToken);

        if (invitation == null)
            return Result<ApiMessageResponse>.Error(ErrorCodes.UserInvitationInvalid);

        bool emailExists = await userRepository
            .ExistsByEmailInOrganizationAsync(invitation.Email, invitation.OrganizationId, cancellationToken);

        if (emailExists)
            return Result<ApiMessageResponse>.Conflict(ErrorCodes.AuthEmailAlreadyUsed);

        User user = new User
        {
            OrganizationId = invitation.OrganizationId,
            Email = invitation.Email,
            PasswordHash = passwordHasher.Hash(model.Password),
            FirstName = model.FirstName,
            LastName = model.LastName,
            Role = invitation.Role,
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            invitation.AcceptedAt = DateTime.UtcNow;

            await userRepository.AddAsync(user, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.InvitationAccepted,
            entityType: AuditEntityTypes.User,
            organizationId: invitation.OrganizationId,
            entityId: user.Id);

        return Result<ApiMessageResponse>.Success(ApiMessageResponse.Create(SuccessCodes.UserAccountCreated));
    }
}
