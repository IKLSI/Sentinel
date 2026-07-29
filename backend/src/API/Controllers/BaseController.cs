using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;

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

    protected BadRequestObjectResult BadRequestCode(string code, IReadOnlyDictionary<string, string>? parameters = null) =>
        BadRequest(BuildError(code, StatusCodes.Status400BadRequest, parameters));

    protected UnauthorizedObjectResult UnauthorizedCode(string code, IReadOnlyDictionary<string, string>? parameters = null) =>
        Unauthorized(BuildError(code, StatusCodes.Status401Unauthorized, parameters));

    protected NotFoundObjectResult NotFoundCode(string code, IReadOnlyDictionary<string, string>? parameters = null) =>
        NotFound(BuildError(code, StatusCodes.Status404NotFound, parameters));

    protected ConflictObjectResult ConflictCode(string code, IReadOnlyDictionary<string, string>? parameters = null) =>
        Conflict(BuildError(code, StatusCodes.Status409Conflict, parameters));

    private static ApiErrorResponse BuildError(string code, int status, IReadOnlyDictionary<string, string>? parameters) =>
        new() { Code = code, Status = status, Params = parameters };
}
