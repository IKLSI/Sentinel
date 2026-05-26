using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

public abstract class BaseController : ControllerBase
{
    protected Guid? GetCurrentUserId()
    {
        string? claim = User.FindFirst(ClaimNames.UserId)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }

    protected Guid? GetOrganizationId()
    {
        string? claim = User.FindFirst(ClaimNames.OrganizationId)?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }

    protected string? GetCurrentJti() => User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

    protected bool CurrentUserIsClient() =>
        User.FindFirst(ClaimTypes.Role)?.Value == UserRole.Client.ToString();
}
