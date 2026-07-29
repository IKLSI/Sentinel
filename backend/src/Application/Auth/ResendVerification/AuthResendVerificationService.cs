using Hangfire;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
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

namespace Sentinel.Application.Auth.ResendVerification;

public class AuthResendVerificationService(
    IUserRepository userRepository,
    IEmailVerificationTokenRepository tokenRepository,
    IUnitOfWorkManager unitOfWorkManager,
    ISystemScope systemScope,
    IBackgroundJobClient jobs,
    IAuditLogService auditLog,
    AuthResendVerificationValidator validator) : IService
{
    private const int VerificationValidityHours = 48;

    public async Task<Result<ApiMessageResponse>> ExecuteAsync(ResendVerificationRequest model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        using IDisposable elevation = systemScope.Enter();

        string email = model.Email.ToLower().Trim();

        User? user = await userRepository.GetOrDefaultByEmailAsync(email,
            new SingleEntityQueryOptions<User> { AsNoTracking = true }, cancellationToken);

        if (user == null || user.IsEmailVerified)
            return ApiMessageResponse.Create(SuccessCodes.AuthVerificationResent);

        await tokenRepository.InvalidatePendingAsync(email, cancellationToken);

        string rawToken = SecureToken.Generate();

        EmailVerificationToken verificationToken = new EmailVerificationToken
        {
            Email = email,
            TokenHash = SecureToken.Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(VerificationValidityHours)
        };

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            await tokenRepository.AddAsync(verificationToken, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
        }

        jobs.Enqueue<SendEmailVerificationJob>(j => j.ExecuteAsync(email, rawToken));

        await auditLog.LogAsync(AuditAction.EmailVerificationResent, entityType: AuditEntityTypes.User);

        return ApiMessageResponse.Create(SuccessCodes.AuthVerificationResent);
    }
}
