using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Services;

public class TenantContext(IHttpContextAccessor httpContextAccessor) : ITenantContext
{
    public Guid? OrganizationId => ReadGuidClaim(ClaimNames.OrganizationId);

    public Guid? UserId => ReadGuidClaim(ClaimNames.UserId);

    public string? Jti => ReadClaim(JwtRegisteredClaimNames.Jti);

    public DateTime? TokenExpiresAtUtc =>
        long.TryParse(ReadClaim(JwtRegisteredClaimNames.Exp), out long expSeconds)
            ? DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime
            : null;

    public bool IsSet => OrganizationId.HasValue;

    private Guid? ReadGuidClaim(string claimType) =>
        Guid.TryParse(ReadClaim(claimType), out Guid value) ? value : null;

    private string? ReadClaim(string claimType)
    {
        ClaimsPrincipal? user = httpContextAccessor.HttpContext?.User;

        if (user?.Identity?.IsAuthenticated != true) return null;

        return user.FindFirst(claimType)?.Value;
    }
}
