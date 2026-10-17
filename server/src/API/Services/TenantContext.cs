using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Services;

public class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly Lock _resolutionGate = new Lock();

    private volatile bool _resolved;
    private Guid? _organizationId;
    private Guid? _userId;
    private string? _jti;

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

    public bool IsSet => OrganizationId.HasValue;

    public void Reset()
    {
        lock (_resolutionGate)
        {
            _organizationId = null;
            _userId = null;
            _jti = null;
            _resolved = false;
        }
    }

    private void ResolveIfAuthenticated()
    {
        if (_resolved) return;

        lock (_resolutionGate)
        {
            if (_resolved) return;

            ClaimsPrincipal? user = _httpContextAccessor.HttpContext?.User;

            if (user?.Identity?.IsAuthenticated is not true) return;

            if (Guid.TryParse(user.FindFirst(ClaimNames.OrganizationId)?.Value, out Guid organizationId))
                _organizationId = organizationId;

            if (Guid.TryParse(user.FindFirst(ClaimNames.UserId)?.Value, out Guid userId))
                _userId = userId;

            _jti = user.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

            _resolved = true;
        }
    }
}
