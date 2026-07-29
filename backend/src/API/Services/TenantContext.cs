using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Services;

public class TenantContext : ITenantContext
{
    public Guid? OrganizationId { get; }

    public Guid? UserId { get; }

    public string? Jti { get; }

    public DateTime? TokenExpiresAtUtc { get; }

    public bool IsSet => OrganizationId.HasValue;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        ClaimsPrincipal? user = httpContextAccessor.HttpContext?.User;

        if (user?.Identity?.IsAuthenticated != true) return;

        if (Guid.TryParse(user.FindFirst(ClaimNames.OrganizationId)?.Value, out Guid organizationId))
            OrganizationId = organizationId;

        if (Guid.TryParse(user.FindFirst(ClaimNames.UserId)?.Value, out Guid userId))
            UserId = userId;

        Jti = user.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

        if (long.TryParse(user.FindFirst(JwtRegisteredClaimNames.Exp)?.Value, out long expSeconds))
            TokenExpiresAtUtc = DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime;
    }
}
