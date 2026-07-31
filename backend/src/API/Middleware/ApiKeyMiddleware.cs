using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.Application.ApiKeys.Validate;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;

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

            var result = await apiKeyValidateService.ExecuteAsync(rawKey.ToString(), context.RequestAborted);
            if (result.HasValue)
            {
                (ApiKey key, User user) = result.Value;
                Claim[] claims =
                [
                    new Claim(ClaimNames.UserId, user.Id.ToString()),
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role.ToString()),
                    new Claim(ClaimNames.OrganizationId, user.OrganizationId.ToString()),
                    new Claim(ClaimNames.ApiKeyId, key.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Jti, key.Id.ToString()),
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
