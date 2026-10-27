using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Remediation;
using Sentinel.Application.Remediation.Start;
using Sentinel.Application.Suppressions;
using Sentinel.Application.Suppressions.Remove;
using Sentinel.Application.Suppressions.Suppress;
using Sentinel.Domain.Entities;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/tech-health")]
[AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
public class ProjectFindingsController : BaseController
{
    [HttpPost("projects/{id:guid}/suppressions")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<SuppressionDto>> SuppressVulnerability(
        Guid id,
        [FromBody] SuppressVulnerabilityDto dto,
        [FromServices] SuppressVulnerabilityService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, dto, cancellationToken));

    [HttpDelete("projects/{id:guid}/suppressions/{suppressionId:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> RemoveSuppression(
        Guid id,
        Guid suppressionId,
        [FromServices] RemoveSuppressionService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, suppressionId, cancellationToken));

    [SkipConnectionScope]
    [HttpPost("projects/{id:guid}/remediations")]
    public async Task<ActionResult<RemediationDto>> StartRemediation(
        Guid id,
        [FromServices] StartRemediationService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));
}
