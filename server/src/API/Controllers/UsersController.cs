using Sentinel.API.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.Application.Users.AcceptInvitation;
using Sentinel.Application.Users.DeleteAccount;
using Sentinel.Application.Users.ExportData;
using Sentinel.Application.Users.Grid;
using Sentinel.Application.Users.Invite;
using Sentinel.Application.Users.Update;
using Sentinel.Application.Users.UpdatePreferences;
using Sentinel.Application.Users.UpdateProfile;
using Sentinel.Domain.Entities;
using Sentinel.Application.Common.Contracts;
using Sentinel.Application.Users;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : BaseController
{
    [HttpGet]
    public async Task<ActionResult<UserListDto>> GetUsers(
        [FromQuery] UserGridModel query,
        [FromServices] UserGridService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(query, cancellationToken));

    [HttpPost]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<ApiMessageResponse>> InviteUser(
        [FromBody] CreateUserDto dto,
        [FromServices] UserInviteService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));

    [HttpPost("accept-invitation")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Invitation)]
    public async Task<ActionResult<ApiMessageResponse>> AcceptInvitation(
        [FromBody] AcceptInvitationDto dto,
        [FromServices] UserAcceptInvitationService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));

    [HttpPut("{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<UserDto>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserDto dto,
        [FromServices] UserUpdateService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, dto, cancellationToken));

    [HttpPatch("me/preferences")]
    public async Task<IActionResult> UpdatePreferences(
        [FromBody] UpdatePreferencesDto dto,
        [FromServices] UserUpdatePreferencesService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));

    [HttpPatch("me")]
    public async Task<ActionResult<UserDto>> UpdateMyProfile(
        [FromBody] UpdateMyProfileDto dto,
        [FromServices] UserUpdateProfileService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));

    [HttpGet("me/export")]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportMyData(
        [FromServices] UserExportDataService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(cancellationToken));

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyAccount(
        [FromBody] DeleteAccountDto dto,
        [FromServices] UserDeleteAccountService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));
}
