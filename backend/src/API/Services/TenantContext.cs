using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Services;

public class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    private bool _resolved;
    private Guid? _organizationId;
    private Guid? _userId;
    private string? _jti;
    private DateTime? _tokenExpiresAtUtc;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? OrganizationId
    {
        get
        {
            ResolveIfAuthenticated();
            return _organizationId;
        }
    }

    public Guid? UserId
    {
        get
        {
            ResolveIfAuthenticated();
            return _userId;
        }
    }

    public string? Jti
    {
        get
        {
            ResolveIfAuthenticated();
            return _jti;
        }
    }

    public DateTime? TokenExpiresAtUtc
    {
        get
        {
            ResolveIfAuthenticated();
            return _tokenExpiresAtUtc;
        }
    }

    public bool IsSet => OrganizationId.HasValue;

    private void ResolveIfAuthenticated()
    {
        if (_resolved) return;

        ClaimsPrincipal? user = _httpContextAccessor.HttpContext?.User;

        if (user?.Identity?.IsAuthenticated is not true) return;

        if (Guid.TryParse(user.FindFirst(ClaimNames.OrganizationId)?.Value, out Guid organizationId))
            _organizationId = organizationId;

        if (Guid.TryParse(user.FindFirst(ClaimNames.UserId)?.Value, out Guid userId))
            _userId = userId;

        _jti = user.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

        if (long.TryParse(user.FindFirst(JwtRegisteredClaimNames.Exp)?.Value, out long expSeconds))
            _tokenExpiresAtUtc = DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime;

        _resolved = true;
    }
}
