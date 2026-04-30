using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;
using Sentinel.API.Jobs;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : BaseController
{
    private readonly AuthService _authService;
    private readonly ITokenBlacklistService _blacklist;

    public AuthController(AuthService authService, ITokenBlacklistService blacklist)
    {
        _authService = authService;
        _blacklist = blacklist;
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        LoginResponse? result = await _authService.LoginAsync(request.Email, request.Password);

        if (result == null)
        {
            return Unauthorized(new { message = "Email ou mot de passe incorrect" });
        }

        return Ok(result);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        LoginResponse? result = await _authService.RefreshTokenAsync(request.RefreshToken);

        if (result == null)
        {
            return Unauthorized(new { message = "Token de rafraîchissement invalide ou expiré" });
        }

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

        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("password-reset")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        PasswordResetToken? resetToken = await _authService.CreatePasswordResetTokenAsync(request.Email);

        if (resetToken != null)
        {
            BackgroundJob.Enqueue<SendPasswordResetEmailJob>(j => j.ExecuteAsync(resetToken.Id));
        }

        return Ok(new { message = "Si un compte existe pour cet email, vous recevrez un lien de réinitialisation." });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("password-reset")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        bool success = await _authService.ResetPasswordAsync(request.Token, request.Password);

        if (!success)
        {
            return BadRequest(new { message = "Le lien de réinitialisation est invalide ou expiré." });
        }

        return Ok(new { message = "Mot de passe réinitialisé avec succès." });
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
            Theme = user.Theme
        });
    }

}
