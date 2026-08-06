using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Settings.ConnectIntegration;
using Sentinel.Application.Settings.GetIntegrations;
using Sentinel.Application.Settings.GetOrganization;
using Sentinel.Application.Settings.UpdateOrganization;
using Sentinel.Domain.Entities;
using Sentinel.Application.Settings;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize]
[AuthorizeRoles(UserRole.Admin)]
public class SettingsController : BaseController
{
    [HttpGet("integrations")]
    public async Task<ActionResult<IntegrationSettingsDto>> GetIntegrationSettings(
        [FromServices] IntegrationSettingsGetService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpPost("integrations/github")]
    public async Task<IActionResult> ConnectGithub(
        [FromBody] ConnectIntegrationDto dto,
        [FromServices] IntegrationConnectService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, RepositoryType.GitHub, cancellationToken));

    [HttpPost("integrations/gitlab")]
    public async Task<IActionResult> ConnectGitlab(
        [FromBody] ConnectIntegrationDto dto,
        [FromServices] IntegrationConnectService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, RepositoryType.GitLab, cancellationToken));

    [HttpGet("organization")]
    public async Task<ActionResult<OrganizationSettingsDto>> GetOrganizationSettings(
        [FromServices] OrganizationSettingsGetService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpPut("organization")]
    public async Task<ActionResult<OrganizationSettingsDto>> UpdateOrganizationSettings(
        [FromBody] UpdateOrganizationSettingsDto dto,
        [FromServices] OrganizationSettingsUpdateService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));
}
