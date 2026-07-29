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

namespace Sentinel.Application.Auth.ResetPassword;

public class AuthResetPasswordService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IPasswordResetTokenRepository tokenRepository,
    IUnitOfWorkManager unitOfWorkManager,
    ISystemScope systemScope,
    IAuditLogService auditLog,
    ILogger<AuthResetPasswordService> logger,
    AuthResetPasswordValidator validator) : IService
{

    public async Task<Result<ApiMessageResponse>> ExecuteAsync(ResetPasswordRequest model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        using IDisposable elevation = systemScope.Enter();

        PasswordResetToken? resetToken = await tokenRepository
            .GetOrDefaultValidByTokenHashAsync(SecureToken.Hash(model.Token), cancellationToken);

        if (resetToken == null)
            return Result<ApiMessageResponse>.Error(ErrorCodes.AuthInvalidResetLink);

        User? user = await userRepository.GetOrDefaultActiveByEmailAsync(resetToken.Email,
            new SingleEntityQueryOptions<User>(), cancellationToken);

        if (user == null)
            return Result<ApiMessageResponse>.Error(ErrorCodes.AuthInvalidResetLink);

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            user.PasswordHash = passwordHasher.Hash(model.Password);
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.TokenVersion++;

            resetToken.IsUsed = true;

            await unitOfWork.CommitAsync(cancellationToken);
        }

        logger.LogInformation("Mot de passe réinitialisé pour {Email}", user.Email);

        await auditLog.LogAsync(AuditAction.PasswordReset, entityType: AuditEntityTypes.User);

        return ApiMessageResponse.Create(SuccessCodes.AuthPasswordReset);
    }
}
