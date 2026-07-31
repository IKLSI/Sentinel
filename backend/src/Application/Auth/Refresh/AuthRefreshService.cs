using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Auth.Refresh;

public class AuthRefreshService : IService
{
    private readonly IUserRepository _userRepository;
    private readonly ICommitScopeFactory _commitScopeFactory;
    private readonly TokenService _tokenService;
    private readonly JwtSettings _jwt;
    private readonly ISystemScope _systemScope;
    private readonly IAuditLogService _auditLog;
    private readonly IRefreshTokenStore _refreshTokenStore;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AuthRefreshService> _logger;

    public AuthRefreshService(
        IUserRepository userRepository,
        ICommitScopeFactory commitScopeFactory,
        TokenService tokenService,
        IOptions<JwtSettings> jwtOptions,
        ISystemScope systemScope,
        IAuditLogService auditLog,
        IRefreshTokenStore refreshTokenStore,
        IMemoryCache cache,
        ILogger<AuthRefreshService> logger)
    {
        _userRepository = userRepository;
        _commitScopeFactory = commitScopeFactory;
        _tokenService = tokenService;
        _jwt = jwtOptions.Value;
        _systemScope = systemScope;
        _auditLog = auditLog;
        _refreshTokenStore = refreshTokenStore;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Result<LoginResponse>> ExecuteAsync(CancellationToken cancellationToken)
    {
        string? refreshToken = _refreshTokenStore.Read();

        if (string.IsNullOrEmpty(refreshToken))
            return Result<LoginResponse>.Unauthorized(ErrorCodes.AuthInvalidRefreshToken);

        string tokenHash = _tokenService.HashRefreshToken(refreshToken);

        User? user;
        string newAccessToken;
        string newRefreshToken;

        using (_systemScope.Enter())
        {
            user = await _userRepository.GetOrDefaultByRefreshTokenHashAsync(tokenHash, cancellationToken);

            if (user == null)
            {
                await RevokeOnReplayAsync(tokenHash, cancellationToken);
                _refreshTokenStore.Clear();

                return Result<LoginResponse>.Unauthorized(ErrorCodes.AuthInvalidRefreshToken);
            }

            newAccessToken = _tokenService.GenerateAccessToken(user);
            newRefreshToken = _tokenService.GenerateRefreshToken();

            using ICommitScope commitScope = _commitScopeFactory.Begin();

            user.PreviousRefreshTokenHash = user.RefreshToken;
            user.RefreshToken = _tokenService.HashRefreshToken(newRefreshToken);
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(RefreshTokenLifetime.DaysFor(_jwt));

            await commitScope.CommitAsync(cancellationToken);
        }

        _refreshTokenStore.Write(newRefreshToken);

        await _auditLog.LogAsync(
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
        User? replayUser = await _userRepository
            .GetOrDefaultByPreviousRefreshTokenHashAsync(tokenHash, cancellationToken);

        if (replayUser == null) return;

        using ICommitScope commitScope = _commitScopeFactory.Begin();

        replayUser.RefreshToken = null;
        replayUser.RefreshTokenExpiry = null;
        replayUser.TokenVersion++;

        await commitScope.CommitAsync(cancellationToken);

        _cache.Remove(CacheKeys.AuthAccount(replayUser.Id));

        _logger.LogWarning("Token replay detected for userId {UserId}", replayUser.Id);
    }
}
