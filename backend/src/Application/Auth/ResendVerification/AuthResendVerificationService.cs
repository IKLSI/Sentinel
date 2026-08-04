using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Common.Contracts;

namespace Sentinel.Application.Auth.ResendVerification;

public class AuthResendVerificationService(
    IUserRepository userRepository,
    IEmailVerificationTokenRepository tokenRepository,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope,
    IJobScheduler jobs,
    IAuditLogService auditLog,
    QueuedTokenProtector tokenProtector,
    AuthResendVerificationValidator validator) : IService
{
    private const int VerificationValidityHours = 48;

    public async Task<Result<ApiMessageResponse>> ExecuteAsync(ResendVerificationRequest model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        string email = model.Email.ToLowerInvariant().Trim();
        string rawToken = SecureToken.Generate();

        using (systemScope.Enter())
        {
            User? user = await userRepository.GetOrDefaultByEmailAsync(email,
                QueryTracking.NoTracking, cancellationToken);

            if (user == null || user.IsEmailVerified)
                return ApiMessageResponse.Create(SuccessCodes.AuthVerificationResent);

            await tokenRepository.InvalidatePendingAsync(email, cancellationToken);

            EmailVerificationToken verificationToken = new EmailVerificationToken
            {
                UserId = user.Id,
                Email = email,
                TokenHash = SecureToken.Hash(rawToken),
                ExpiresAt = DateTime.UtcNow.AddHours(VerificationValidityHours)
            };

            using ICommitScope commitScope = commitScopeFactory.Begin();

            await tokenRepository.AddAsync(verificationToken, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        string protectedToken = tokenProtector.Protect(rawToken);

        jobs.Enqueue<SendEmailVerificationJob>(j => j.ExecuteAsync(email, protectedToken));

        await auditLog.LogAsync(AuditAction.EmailVerificationResent, entityType: AuditEntityTypes.User);

        return ApiMessageResponse.Create(SuccessCodes.AuthVerificationResent);
    }
}
