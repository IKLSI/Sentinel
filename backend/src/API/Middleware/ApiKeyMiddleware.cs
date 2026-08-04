using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.Application.ApiKeys.Validate;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Middleware;

public class ApiKeyMiddleware
{
    private const string HeaderName = "X-Api-Key";

    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyMiddleware> _logger;

    public ApiKeyMiddleware(RequestDelegate next, ILogger<ApiKeyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated is not true
            && context.Request.Headers.TryGetValue(HeaderName, out Microsoft.Extensions.Primitives.StringValues rawKey)
            && !string.IsNullOrWhiteSpace(rawKey))
        {
            ApiKeyValidateService apiKeyValidateService =
                context.RequestServices.GetRequiredService<ApiKeyValidateService>();

            Result<ApiKeyPrincipalDto> result =
                await apiKeyValidateService.ExecuteAsync(rawKey.ToString(), context.RequestAborted);

            if (result.IsSuccess)
            {
                ApiKeyPrincipalDto principal = result.Value!;
                Claim[] claims =
                [
                    new Claim(ClaimNames.UserId, principal.UserId.ToString()),
                    new Claim(ClaimTypes.NameIdentifier, principal.UserId.ToString()),
                    new Claim(ClaimTypes.Email, principal.Email),
                    new Claim(ClaimTypes.Role, principal.Role),
                    new Claim(ClaimNames.OrganizationId, principal.OrganizationId.ToString()),
                    new Claim(ClaimNames.ApiKeyId, principal.ApiKeyId.ToString()),
                    new Claim(JwtRegisteredClaimNames.Jti, principal.ApiKeyId.ToString()),
                ];
                ClaimsIdentity identity = new ClaimsIdentity(claims, "ApiKey");
                context.User = new ClaimsPrincipal(identity);

                context.RequestServices.GetRequiredService<ITenantContext>().Reset();
            }
            else
            {
                _logger.LogWarning("API key rejected from {RemoteIp} on {Path}",
                    context.Connection.RemoteIpAddress, context.Request.Path);
            }
        }

        await _next(context);
    }
}
