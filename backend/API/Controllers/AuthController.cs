using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using TMAflow.Domain.DTOs.Auth;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly AuditService _auditService;

    public AuthController(AuthService authService, AuditService auditService)
    {
        _authService = authService;
        _auditService = auditService;
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

        await _auditService.LogAsync(result.User.Id, "LOGIN", "User", result.User.Id, new { email = request.Email });

        return Ok(result);
    }

    [HttpPost("refresh")]
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

        await _authService.LogoutAsync(userId.Value);
        await _auditService.LogAsync(userId, "LOGOUT", "User", userId);

        return NoContent();
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

    private Guid? GetCurrentUserId()
    {
        string? userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out Guid userId) ? userId : null;
    }
}
