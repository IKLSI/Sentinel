using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.Application.Services;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;

namespace Sentinel.API.Middleware;

public class ApiKeyMiddleware
{
    private const string ApiKeyHeader = "X-Api-Key";
    private readonly RequestDelegate _next;

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApiKeyService apiKeyService)
    {
        if (!context.User.Identity?.IsAuthenticated == true
            && context.Request.Headers.TryGetValue(ApiKeyHeader, out Microsoft.Extensions.Primitives.StringValues rawKey)
            && !string.IsNullOrWhiteSpace(rawKey))
        {
            var result = await apiKeyService.ValidateAsync(rawKey.ToString());
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
            }
        }

        await _next(context);
    }
}
