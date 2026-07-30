using Hangfire;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Users.Invite;

public class UserInviteService(
    IUserInvitationRepository invitationRepository,
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    IBackgroundJobClient jobs,
    IAuditLogService auditLog,
    QuotaGuard quotaGuard,
    ISystemScope systemScope,
    IOptions<FrontendSettings> frontendOptions,
    ITenantContext tenant,
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

        Result quotaResult = await quotaGuard.EnsureCanInviteMemberAsync(organizationId, cancellationToken);

        if (!quotaResult.IsSuccess)
            return Result<ApiMessageResponse>.From(quotaResult);

        Result roleResult = validator.ValidateRole(model, out UserRole role);

        if (!roleResult.IsSuccess)
            return Result<ApiMessageResponse>.From(roleResult);

        string email = model.Email.ToLowerInvariant();

        bool accountExistsElsewhere;

        using (systemScope.Enter())
        {
            accountExistsElsewhere = await userRepository.ExistsByEmailAcrossTenantsAsync(email, cancellationToken);
        }

        if (accountExistsElsewhere)
        {
            string frontendBaseUrl = frontendOptions.Value.BaseUrl;

            jobs.Enqueue<IEmailService>(s => s.SendExistingAccountNoticeAsync(email, frontendBaseUrl));

            return Result<ApiMessageResponse>.Accepted(
                ApiMessageResponse.Create(SuccessCodes.UserInvitationSent));
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

        jobs.Enqueue<SendInvitationEmailJob>(j => j.ExecuteAsync(invitation.Id, rawToken));

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
