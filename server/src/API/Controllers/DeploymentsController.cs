using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.API.Constants;
using Sentinel.Application.Deployments.Compare;
using Sentinel.Application.Deployments.GetRefs;
using Sentinel.Domain.Entities;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/tech-health/projects/{id:guid}/deployments")]
[AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
public class DeploymentsController : BaseController
{
    [HttpGet("refs")]
    [SkipConnectionScope]
    public async Task<ActionResult<ReleaseRefsDto>> GetRefs(
        Guid id,
        [FromServices] ReleaseRefsGetService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpGet("compare")]
    [EnableRateLimiting(RateLimitPolicies.DeploymentComparison)]
    [SkipConnectionScope]
    public async Task<ActionResult<ReleaseComparisonDto>> Compare(
        Guid id,
        [FromQuery] ReleaseComparisonModel query,
        [FromServices] ReleaseComparisonService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, query, cancellationToken));
}
