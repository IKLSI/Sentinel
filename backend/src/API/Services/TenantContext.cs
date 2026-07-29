using System.Security.Claims;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Services;

public class TenantContext : ITenantContext
{
    public Guid? OrganizationId { get; }
    public Guid? UserId { get; }
    public bool IsSet => OrganizationId.HasValue;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        ClaimsPrincipal? user = httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true) return;

        string? orgClaim = user.FindFirst(ClaimNames.OrganizationId)?.Value;
        if (Guid.TryParse(orgClaim, out Guid orgId)) OrganizationId = orgId;

        string? userClaim = user.FindFirst(ClaimNames.UserId)?.Value;
        if (Guid.TryParse(userClaim, out Guid uid)) UserId = uid;
    }
}
