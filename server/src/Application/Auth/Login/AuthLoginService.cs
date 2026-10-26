using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.Login;

public class AuthLoginService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ICommitScopeFactory commitScopeFactory,
    SessionTokenIssuer sessionTokenIssuer,
    ISystemScope systemScope,
    IAuditLogService auditLog,
    IRefreshTokenStore refreshTokenStore,
    ILogger<AuthLoginService> logger,
    AuthLoginValidator validator,
    LoginAttemptTracker loginAttempts,
    IClientAddressProvider clientAddress) : IService
{
    public async Task<Result<LoginResponse>> ExecuteAsync(LoginRequest model, CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<LoginResponse>.From(validationResult);

        string email = model.Email.Trim();
        string attemptKey = $"{email}|{clientAddress.Current}";

        if (loginAttempts.IsLockedOut(attemptKey))
            return Result<LoginResponse>.Unauthorized(ErrorCodes.AuthTooManyAttempts);

        User? user;
        string accessToken;
        string refreshToken;

        using (systemScope.Enter())
        {
            IReadOnlyList<User> candidates = await userRepository
                .ListActiveByEmailAsync(email, QueryTracking.Tracked, cancellationToken);

            user = ResolveSingleMatch(candidates, model.Password);

            if (user == null)
            {
                bool lockedOut = loginAttempts.RecordFailure(attemptKey);

                await auditLog.LogAsync(
                    AuditAction.LoginFailed,
                    entityType: AuditEntityTypes.User,
                    organizationId: candidates.Count == 1 ? candidates[0].OrganizationId : null,
                    userId: candidates.Count == 1 ? candidates[0].Id : null,
                    entityId: candidates.Count == 1 ? candidates[0].Id : null);

                return Result<LoginResponse>.Unauthorized(lockedOut
                    ? ErrorCodes.AuthTooManyAttempts
                    : ErrorCodes.AuthInvalidCredentials);
            }

            loginAttempts.Reset(attemptKey);

            if (!user.IsEmailVerified)
                return Result<LoginResponse>.Forbidden(ErrorCodes.AuthEmailNotVerified);

            using ICommitScope commitScope = commitScopeFactory.Begin();

            (accessToken, refreshToken) = sessionTokenIssuer.Issue(user);
            user.LastLoginAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        refreshTokenStore.Write(refreshToken);

        await auditLog.LogAsync(
            AuditAction.Login,
            entityType: AuditEntityTypes.User,
            organizationId: user.OrganizationId,
            userId: user.Id,
            entityId: user.Id);

        return new LoginResponse
        {
            AccessToken = accessToken,
            User = UserProfileMapper.ToProfile(user)
        };
    }

    private User? ResolveSingleMatch(IReadOnlyList<User> candidates, string password)
    {
        if (candidates.Count == 0)
        {
            passwordHasher.VerifyAgainstDecoy(password);
            return null;
        }

        User? match = null;

        foreach (User candidate in candidates)
        {
            if (!passwordHasher.Verify(password, candidate.PasswordHash)) continue;

            if (match != null)
            {
                logger.LogWarning(
                    "Several accounts match login {Email} — sign-in refused as ambiguous",
                    candidate.Email);
                return null;
            }

            match = candidate;
        }

        return match;
    }
}
