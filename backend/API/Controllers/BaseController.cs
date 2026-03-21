using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Sentinel.API.Controllers;

public abstract class BaseController : ControllerBase
{
    protected Guid? GetCurrentUserId()
    {
        string? claim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }

    protected Guid? GetOrganizationId()
    {
        string? claim = User.FindFirst("organizationId")?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }
}
