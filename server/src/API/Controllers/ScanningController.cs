using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.API.Constants;
using Sentinel.Application.Scanning.GetProgress;
using Sentinel.Application.Scanning.Trigger;
using Sentinel.Domain.Entities;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/tech-health")]
[AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
public class ScanningController : BaseController
{
    [HttpGet("projects/scan-progress")]
    [SkipConnectionScope]
    [AllowApiKey]
    public async Task<ActionResult<List<ScanProgressDto>>> GetScanProgress(
        [FromServices] ScanProgressListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpPost("projects/{id:guid}/scan")]
    [AllowApiKey]
    [EnableRateLimiting(RateLimitPolicies.Scan)]
    public async Task<IActionResult> TriggerScan(
        Guid id,
        [FromServices] ProjectScanTriggerService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));
}
