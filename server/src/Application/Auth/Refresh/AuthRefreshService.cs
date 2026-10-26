using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.Refresh;

public class AuthRefreshService(
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    TokenService tokenService,
    SessionTokenIssuer sessionTokenIssuer,
    ISystemScope systemScope,
    IAuditLogService auditLog,
    IRefreshTokenStore refreshTokenStore,
    IMemoryCache cache,
    ILogger<AuthRefreshService> logger) : IService
{
    public async Task<Result<LoginResponse>> ExecuteAsync(CancellationToken cancellationToken)
    {
        string? refreshToken = refreshTokenStore.Read();

        if (string.IsNullOrEmpty(refreshToken))
            return Result<LoginResponse>.Unauthorized(ErrorCodes.AuthInvalidRefreshToken);

        string tokenHash = tokenService.HashRefreshToken(refreshToken);

        User? user;
        string newAccessToken;
        string newRefreshToken;

        using (systemScope.Enter())
        {
            user = await userRepository.GetOrDefaultByRefreshTokenHashAsync(tokenHash, cancellationToken);

            if (user == null)
            {
                await RevokeOnReplayAsync(tokenHash, cancellationToken);
                refreshTokenStore.Clear();

                return Result<LoginResponse>.Unauthorized(ErrorCodes.AuthInvalidRefreshToken);
            }

            using ICommitScope commitScope = commitScopeFactory.Begin();

            user.PreviousRefreshTokenHash = user.RefreshToken;
            (newAccessToken, newRefreshToken) = sessionTokenIssuer.Issue(user);

            await commitScope.CommitAsync(cancellationToken);
        }

        refreshTokenStore.Write(newRefreshToken);

        await auditLog.LogAsync(
            AuditAction.TokenRefreshed,
            entityType: AuditEntityTypes.User,
            organizationId: user.OrganizationId,
            userId: user.Id,
            entityId: user.Id);

        return new LoginResponse
        {
            AccessToken = newAccessToken,
            User = UserProfileMapper.ToProfile(user)
        };
    }

    private async Task RevokeOnReplayAsync(string tokenHash, CancellationToken cancellationToken)
    {
        User? replayUser = await userRepository
            .GetOrDefaultByPreviousRefreshTokenHashAsync(tokenHash, cancellationToken);

        if (replayUser == null) return;

        using ICommitScope commitScope = commitScopeFactory.Begin();

        replayUser.RevokeSessions();

        await commitScope.CommitAsync(cancellationToken);

        cache.Remove(CacheKeys.AuthAccount(replayUser.Id));

        logger.LogWarning("Token replay detected for userId {UserId}", replayUser.Id);

        await auditLog.LogAsync(
            AuditAction.RefreshTokenReplayed,
            entityType: AuditEntityTypes.User,
            organizationId: replayUser.OrganizationId,
            userId: replayUser.Id,
            entityId: replayUser.Id);
    }
}
