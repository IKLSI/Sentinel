using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Common.Contracts;

namespace Sentinel.Application.Users.AcceptInvitation;

public class UserAcceptInvitationService(
    IUserInvitationRepository invitationRepository,
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    UserAcceptInvitationValidator validator) : IService
{
    public async Task<Result<ApiMessageResponse>> ExecuteAsync(AcceptInvitationDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        Guid organizationId;
        User user;

        using (systemScope.Enter())
        {
            UserInvitation? invitation = await invitationRepository
                .GetOrDefaultPendingByTokenHashAsync(SecureToken.Hash(model.Token), cancellationToken);

            if (invitation == null)
                return Result<ApiMessageResponse>.Error(ErrorCodes.UserInvitationInvalid);

            bool emailExists = await userRepository
                .ExistsByEmailAcrossTenantsAsync(invitation.Email, cancellationToken);

            if (emailExists)
                return Result<ApiMessageResponse>.Conflict(ErrorCodes.AuthEmailAlreadyUsed);

            organizationId = invitation.OrganizationId;

            user = new User
            {
                OrganizationId = invitation.OrganizationId,
                Email = invitation.Email,
                PasswordHash = passwordHasher.Hash(model.Password),
                FirstName = model.FirstName,
                LastName = model.LastName,
                Role = invitation.Role,
                AccessStatus = UserAccessStatus.Active,
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            using ICommitScope commitScope = commitScopeFactory.Begin();

            invitation.AcceptedAt = DateTime.UtcNow;

            await userRepository.AddAsync(user, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Users), cancellationToken);

        await auditLog.LogAsync(
            AuditAction.InvitationAccepted,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId,
            entityId: user.Id);

        return Result<ApiMessageResponse>.Success(ApiMessageResponse.Create(SuccessCodes.UserAccountCreated));
    }
}
