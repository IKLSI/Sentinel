using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.Application.Remediation.Execute;
using Sentinel.Application.Remediation.History;
using Sentinel.Application.Remediation.Preview;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/remediation")]
[Route("api/v{version:apiVersion}/remediation")]
[Authorize]
public class RemediationController : BaseController
{
    [HttpGet("projects/{id:guid}/preview")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Scan)]
    public async Task<ActionResult<RemediationPreviewDto>> Preview(
        Guid id,
        [FromServices] RemediationPreviewService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Scan)]
    public async Task<ActionResult<RemediationResultDto>> Execute(
        Guid id,
        [FromServices] RemediationExecuteService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpGet("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<List<RemediationHistoryDto>>> History(
        Guid id,
        [FromServices] RemediationHistoryService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));
}
