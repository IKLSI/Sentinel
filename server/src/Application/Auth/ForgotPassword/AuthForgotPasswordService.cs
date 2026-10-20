using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Common.Contracts;

namespace Sentinel.Application.Auth.ForgotPassword;

public class AuthForgotPasswordService(
    IUserRepository userRepository,
    IPasswordResetTokenRepository tokenRepository,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope,
    IJobScheduler jobs,
    IAuditLogService auditLog,
    QueuedTokenProtector tokenProtector,
    AuthForgotPasswordValidator validator) : IService
{
    private const int TokenValidityHours = 1;

    public async Task<Result<ApiMessageResponse>> ExecuteAsync(ForgotPasswordRequest model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        string email = model.Email.ToLowerInvariant();
        string rawToken = SecureToken.Generate();
        User? user;

        using (systemScope.Enter())
        {
            user = await userRepository.GetOrDefaultActiveByEmailAsync(email,
                QueryTracking.NoTracking, cancellationToken);

            if (user == null)
                return ApiMessageResponse.Create(SuccessCodes.AuthPasswordResetRequested);

            await tokenRepository.InvalidatePendingAsync(email, cancellationToken);

            PasswordResetToken resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                Email = email,
                TokenHash = SecureToken.Hash(rawToken),
                ExpiresAt = DateTime.UtcNow.AddHours(TokenValidityHours)
            };

            using ICommitScope commitScope = commitScopeFactory.Begin();

            await tokenRepository.AddAsync(resetToken, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        string protectedToken = tokenProtector.Protect(rawToken);

        jobs.Enqueue<SendPasswordResetEmailJob>(JobQueues.Emails, j => j.ExecuteAsync(email, protectedToken,
            CancellationToken.None));

        await auditLog.LogAsync(
            AuditAction.PasswordResetRequested,
            entityType: AuditEntityTypes.User,
            organizationId: user.OrganizationId,
            userId: user.Id,
            entityId: user.Id);

        return ApiMessageResponse.Create(SuccessCodes.AuthPasswordResetRequested);
    }
}
