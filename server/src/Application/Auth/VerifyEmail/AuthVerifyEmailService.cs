using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Common.Contracts;

namespace Sentinel.Application.Auth.VerifyEmail;

public class AuthVerifyEmailService(
    IUserRepository userRepository,
    IEmailVerificationTokenRepository tokenRepository,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope,
    IAuditLogService auditLog,
    ILogger<AuthVerifyEmailService> logger,
    AuthVerifyEmailValidator validator) : IService
{
    public async Task<Result<ApiMessageResponse>> ExecuteAsync(VerifyEmailRequest model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        User? user;

        using (systemScope.Enter())
        {
            EmailVerificationToken? verificationToken = await tokenRepository
                .GetOrDefaultValidByTokenHashAsync(SecureToken.Hash(model.Token), cancellationToken);

            if (verificationToken == null)
                return Result<ApiMessageResponse>.Error(ErrorCodes.AuthInvalidVerificationLink);

            user = await userRepository.GetOrDefaultAsync(verificationToken.UserId,
                QueryTracking.Tracked, cancellationToken);

            if (user == null)
                return Result<ApiMessageResponse>.Error(ErrorCodes.AuthInvalidVerificationLink);

            using ICommitScope commitScope = commitScopeFactory.Begin();

            user.IsEmailVerified = true;
            verificationToken.IsUsed = true;

            await commitScope.CommitAsync(cancellationToken);
        }

        logger.LogInformation("Email verified for user {UserId}", user.Id);

        await auditLog.LogAsync(
            AuditAction.EmailVerified,
            entityType: AuditEntityTypes.User,
            organizationId: user.OrganizationId,
            userId: user.Id,
            entityId: user.Id);

        return ApiMessageResponse.Create(SuccessCodes.AuthEmailVerified);
    }
}
