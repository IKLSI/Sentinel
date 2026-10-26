using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Common.Contracts;
using Sentinel.Application.Auth;

namespace Sentinel.Application.Users.Invite;

public class UserInviteService(
    IUserInvitationRepository invitationRepository,
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    IJobScheduler jobs,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ISystemScope systemScope,
    ExistingAccountNotifier existingAccountNotifier,
    ITenantContext tenant,
    QueuedTokenProtector tokenProtector,
    UserInviteValidator validator) : IService
{
    private const int InvitationValidityHours = 48;

    public async Task<Result<ApiMessageResponse>> ExecuteAsync(CreateUserDto model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result<ApiMessageResponse>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, organizationId, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        UserRole role = Enum.Parse<UserRole>(model.Role, ignoreCase: true);
        string email = model.Email.ToLowerInvariant();

        using (systemScope.Enter())
        {
            if (await userRepository.ExistsByEmailAcrossTenantsAsync(email, cancellationToken))
            {
                await existingAccountNotifier.NotifyAsync(email, cancellationToken);

                return Result<ApiMessageResponse>.Accepted(
                    ApiMessageResponse.Create(SuccessCodes.UserInvitationSent));
            }
        }

        string rawToken = SecureToken.Generate();

        UserInvitation invitation = new UserInvitation
        {
            OrganizationId = organizationId,
            Email = email,
            Role = role,
            TokenHash = SecureToken.Hash(rawToken),
            InvitedById = currentUserId,
            ExpiresAt = DateTime.UtcNow.AddHours(InvitationValidityHours),
            CreatedAt = DateTime.UtcNow
        };

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await invitationRepository.AddAsync(invitation, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        string protectedToken = tokenProtector.Protect(rawToken);

        jobs.Enqueue<SendInvitationEmailJob>(JobQueues.Emails, j => j.ExecuteAsync(invitation.Id, protectedToken,
            CancellationToken.None));

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Users));

        await auditLog.LogAsync(
            AuditAction.UserInvited,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId,
            userId: currentUserId,
            entityId: invitation.Id,
            jti: tenant.Jti);

        return Result<ApiMessageResponse>.Accepted(ApiMessageResponse.Create(SuccessCodes.UserInvitationSent));
    }
}
