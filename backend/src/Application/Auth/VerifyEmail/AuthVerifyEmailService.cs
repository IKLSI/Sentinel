using Microsoft.Extensions.Logging;
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
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.VerifyEmail;

public class AuthVerifyEmailService(
    IUserRepository userRepository,
    IEmailVerificationTokenRepository tokenRepository,
    IUnitOfWorkManager unitOfWorkManager,
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

        using IDisposable elevation = systemScope.Enter();

        EmailVerificationToken? verificationToken = await tokenRepository
            .GetOrDefaultValidByTokenHashAsync(SecureToken.Hash(model.Token), cancellationToken);

        if (verificationToken == null)
            return Result<ApiMessageResponse>.Error(ErrorCodes.AuthInvalidVerificationLink);

        User? user = await userRepository.GetOrDefaultByEmailAsync(verificationToken.Email,
            new SingleEntityQueryOptions<User>(), cancellationToken);

        if (user == null)
            return Result<ApiMessageResponse>.Error(ErrorCodes.AuthInvalidVerificationLink);

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            user.IsEmailVerified = true;
            verificationToken.IsUsed = true;

            await unitOfWork.CommitAsync(cancellationToken);
        }

        logger.LogInformation("Email vérifié pour {Email}", user.Email);

        await auditLog.LogAsync(AuditAction.EmailVerified, entityType: AuditEntityTypes.User);

        return ApiMessageResponse.Create(SuccessCodes.AuthEmailVerified);
    }
}
