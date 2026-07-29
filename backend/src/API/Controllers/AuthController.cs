using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Asp.Versioning;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;
using Sentinel.Application.Services;
using Sentinel.API.Jobs;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/auth")]
[Route("api/v{version:apiVersion}/auth")]
public class AuthController : BaseController
{
    private readonly AuthService _authService;
    private readonly ITokenBlacklistService _blacklist;
    private readonly IAuditLogService _auditLog;
    private readonly CookieSettings _cookieSettings;
    private readonly JwtSettings _jwtSettings;
    private readonly IWebHostEnvironment _environment;

    public AuthController(AuthService authService, ITokenBlacklistService blacklist, IAuditLogService auditLog, IOptions<CookieSettings> cookieSettings, IOptions<JwtSettings> jwtSettings, IWebHostEnvironment environment)
    {
        _authService = authService;
        _blacklist = blacklist;
        _auditLog = auditLog;
        _cookieSettings = cookieSettings.Value;
        _jwtSettings = jwtSettings.Value;
        _environment = environment;
    }

    private void SetRefreshTokenCookie(string token)
    {
        int expirationDays = _jwtSettings.RefreshTokenExpirationDays > 0 ? _jwtSettings.RefreshTokenExpirationDays : 30;

        Response.Cookies.Append(_cookieSettings.Name, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = Enum.Parse<SameSiteMode>(_cookieSettings.SameSite, ignoreCase: true),
            Domain = string.IsNullOrEmpty(_cookieSettings.Domain) ? null : _cookieSettings.Domain,
            Path = "/api/auth",
            Expires = DateTime.UtcNow.AddDays(expirationDays),
        });
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(_cookieSettings.Name, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = Enum.Parse<SameSiteMode>(_cookieSettings.SameSite, ignoreCase: true),
            Domain = string.IsNullOrEmpty(_cookieSettings.Domain) ? null : _cookieSettings.Domain,
            Path = "/api/auth",
        });
    }

    [HttpPost("login")]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        LoginResponse? result = await _authService.LoginAsync(request.Email, request.Password);

        if (result == null)
        {
            return Unauthorized(new { message = "Email ou mot de passe incorrect" });
        }

        SetRefreshTokenCookie(result.RefreshToken);
        result.RefreshToken = string.Empty;

        await _auditLog.LogAsync(
            AuditAction.Login,
            entityType: AuditEntityTypes.User,
            organizationId: result.User.OrganizationId,
            userId: result.User.Id,
            entityId: result.User.Id);

        return Ok(result);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    public async Task<ActionResult<LoginResponse>> Refresh()
    {
        string? refreshToken = Request.Cookies[_cookieSettings.Name];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "Token de rafraîchissement invalide ou expiré" });
        }

        LoginResponse? result = await _authService.RefreshTokenAsync(refreshToken);

        if (result == null)
        {
            ClearRefreshTokenCookie();
            return Unauthorized(new { message = "Token de rafraîchissement invalide ou expiré" });
        }

        SetRefreshTokenCookie(result.RefreshToken);
        result.RefreshToken = string.Empty;

        await _auditLog.LogAsync(
            AuditAction.TokenRefreshed,
            entityType: AuditEntityTypes.User,
            organizationId: result.User.OrganizationId,
            userId: result.User.Id,
            entityId: result.User.Id);

        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null || userId == Guid.Empty)
        {
            return Unauthorized();
        }

        string? jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        string? expClaim = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;

        if (!string.IsNullOrEmpty(jti) && long.TryParse(expClaim, out long expSeconds))
        {
            DateTime expUtc = DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime;
            _blacklist.Revoke(jti, expUtc);
        }

        await _authService.LogoutAsync(userId.Value);
        ClearRefreshTokenCookie();

        await _auditLog.LogAsync(
            AuditAction.Logout,
            entityType: AuditEntityTypes.User,
            organizationId: GetOrganizationId(),
            userId: userId.Value,
            entityId: userId.Value,
            jti: GetCurrentJti());

        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        (string Email, string RawToken)? resetToken = await _authService.CreatePasswordResetTokenAsync(request.Email);

        if (resetToken != null)
        {
            BackgroundJob.Enqueue<SendPasswordResetEmailJob>(j => j.ExecuteAsync(resetToken.Value.Email, resetToken.Value.RawToken));

            await _auditLog.LogAsync(
                AuditAction.PasswordResetRequested,
                entityType: AuditEntityTypes.User);
        }

        return Ok(new { message = "Si un compte existe pour cet email, vous recevrez un lien de réinitialisation." });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        bool success = await _authService.ResetPasswordAsync(request.Token, request.Password);

        if (!success)
        {
            return BadRequest(new { message = "Le lien de réinitialisation est invalide ou expiré." });
        }

        await _auditLog.LogAsync(
            AuditAction.PasswordReset,
            entityType: AuditEntityTypes.User);

        return Ok(new { message = "Mot de passe réinitialisé avec succès." });
    }

    [HttpPost("register")]
    [EnableRateLimiting(RateLimitPolicies.Register)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        (string Email, string RawToken) token;

        try
        {
            token = await _authService.RegisterAsync(request);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }

        BackgroundJob.Enqueue<SendEmailVerificationJob>(j => j.ExecuteAsync(token.Email, token.RawToken));

        await _auditLog.LogAsync(
            AuditAction.OrganizationRegistered,
            entityType: AuditEntityTypes.Organization);

        return Accepted(new { message = "Compte créé. Consultez votre boîte de réception pour activer votre compte." });
    }

    [HttpPost("verify-email")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        bool success = await _authService.VerifyEmailAsync(request.Token);

        if (!success)
            return BadRequest(new { message = "Le lien de vérification est invalide ou expiré." });

        await _auditLog.LogAsync(
            AuditAction.EmailVerified,
            entityType: AuditEntityTypes.User);

        return Ok(new { message = "Email vérifié avec succès. Vous pouvez maintenant vous connecter." });
    }

    [HttpPost("resend-verification")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        (string Email, string RawToken)? token = await _authService.ResendVerificationAsync(request.Email);

        if (token != null)
        {
            BackgroundJob.Enqueue<SendEmailVerificationJob>(j => j.ExecuteAsync(token.Value.Email, token.Value.RawToken));

            await _auditLog.LogAsync(
                AuditAction.EmailVerificationResent,
                entityType: AuditEntityTypes.User);
        }

        return Ok(new { message = "Si un compte non vérifié existe pour cet email, un nouveau lien d'activation a été envoyé." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfile>> GetCurrentUser()
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null || userId == Guid.Empty)
        {
            return Unauthorized();
        }

        User? user = await _authService.GetUserByIdAsync(userId.Value);

        if (user == null || user.Id == Guid.Empty)
        {
            return NotFound(new { message = "Utilisateur introuvable" });
        }

        return Ok(new UserProfile
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            OrganizationId = user.OrganizationId,
            Theme = user.Theme.ToString().ToLowerInvariant()
        });
    }
}
