using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.Application.Auth.ForgotPassword;
using Sentinel.Application.Auth.GetCurrentUser;
using Sentinel.Application.Auth.Login;
using Sentinel.Application.Auth.Logout;
using Sentinel.Application.Auth.Refresh;
using Sentinel.Application.Auth.Register;
using Sentinel.Application.Auth.ResendVerification;
using Sentinel.Application.Auth.ResetPassword;
using Sentinel.Application.Auth.VerifyEmail;
using Sentinel.Domain.Constants;
using Sentinel.Application.Auth;
using Sentinel.Application.Common.Contracts;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/auth")]
[Route("api/v{version:apiVersion}/auth")]
public class AuthController : BaseController
{
    [HttpPost("login")]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        [FromServices] AuthLoginService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));

    [HttpPost("refresh")]
    [EnableRateLimiting(RateLimitPolicies.Refresh)]
    public async Task<ActionResult<LoginResponse>> Refresh(
        [FromServices] AuthRefreshService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        [FromServices] AuthLogoutService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpPost("forgot-password")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<ActionResult<ApiMessageResponse>> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        [FromServices] AuthForgotPasswordService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));

    [HttpPost("reset-password")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<ActionResult<ApiMessageResponse>> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        [FromServices] AuthResetPasswordService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));

    [HttpPost("register")]
    [EnableRateLimiting(RateLimitPolicies.Register)]
    public async Task<ActionResult<ApiMessageResponse>> Register(
        [FromBody] RegisterRequest request,
        [FromServices] AuthRegisterService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));

    [HttpPost("verify-email")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<ActionResult<ApiMessageResponse>> VerifyEmail(
        [FromBody] VerifyEmailRequest request,
        [FromServices] AuthVerifyEmailService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));

    [HttpPost("resend-verification")]
    [EnableRateLimiting(RateLimitPolicies.PasswordReset)]
    public async Task<ActionResult<ApiMessageResponse>> ResendVerification(
        [FromBody] ResendVerificationRequest request,
        [FromServices] AuthResendVerificationService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfile>> GetCurrentUser(
        [FromServices] AuthGetCurrentUserService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));
}
