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

namespace Sentinel.Application.Auth.Login;

public class AuthLoginService : IService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICommitScopeFactory _commitScopeFactory;
    private readonly TokenService _tokenService;
    private readonly JwtSettings _jwt;
    private readonly ISystemScope _systemScope;
    private readonly IAuditLogService _auditLog;
    private readonly IRefreshTokenStore _refreshTokenStore;
    private readonly ILogger<AuthLoginService> _logger;
    private readonly AuthLoginValidator _validator;

    public AuthLoginService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ICommitScopeFactory commitScopeFactory,
        TokenService tokenService,
        IOptions<JwtSettings> jwtOptions,
        ISystemScope systemScope,
        IAuditLogService auditLog,
        IRefreshTokenStore refreshTokenStore,
        ILogger<AuthLoginService> logger,
        AuthLoginValidator validator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _commitScopeFactory = commitScopeFactory;
        _tokenService = tokenService;
        _jwt = jwtOptions.Value;
        _systemScope = systemScope;
        _auditLog = auditLog;
        _refreshTokenStore = refreshTokenStore;
        _logger = logger;
        _validator = validator;
    }

    public async Task<Result<LoginResponse>> ExecuteAsync(LoginRequest model, CancellationToken cancellationToken)
    {
        Result validationResult = await _validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<LoginResponse>.From(validationResult);

        User? user;
        string accessToken;
        string refreshToken;

        using (_systemScope.Enter())
        {
            IReadOnlyList<User> candidates = await _userRepository
                .ListActiveByEmailAsync(model.Email, QueryTracking.Tracked, cancellationToken);

            user = ResolveSingleMatch(candidates, model.Password);

            if (user == null)
                return Result<LoginResponse>.Unauthorized(ErrorCodes.AuthInvalidCredentials);

            if (!user.IsEmailVerified)
                return Result<LoginResponse>.Forbidden(ErrorCodes.AuthEmailNotVerified);

            accessToken = _tokenService.GenerateAccessToken(user);
            refreshToken = _tokenService.GenerateRefreshToken();

            using ICommitScope commitScope = _commitScopeFactory.Begin();

            user.RefreshToken = _tokenService.HashRefreshToken(refreshToken);
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(RefreshTokenLifetime.DaysFor(_jwt));
            user.LastLoginAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        _refreshTokenStore.Write(refreshToken);

        await _auditLog.LogAsync(
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
            _passwordHasher.VerifyAgainstDecoy(password);
            return null;
        }

        User? match = null;

        foreach (User candidate in candidates)
        {
            if (!_passwordHasher.Verify(password, candidate.PasswordHash)) continue;

            if (match != null)
            {
                _logger.LogWarning(
                    "Several accounts match login {Email} — sign-in refused as ambiguous",
                    candidate.Email);
                return null;
            }

            match = candidate;
        }

        return match;
    }
}
