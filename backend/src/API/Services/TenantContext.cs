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

        string? orgClaim = user.FindFirst(ClaimNames.OrganizationId)?.Value;
        if (Guid.TryParse(orgClaim, out Guid orgId)) OrganizationId = orgId;

        string? userClaim = user.FindFirst(ClaimNames.UserId)?.Value;
        if (Guid.TryParse(userClaim, out Guid uid)) UserId = uid;

        Jti = user.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

        string? expClaim = user.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;
        if (long.TryParse(expClaim, out long expSeconds))
            TokenExpiresAtUtc = DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime;
    }
}
