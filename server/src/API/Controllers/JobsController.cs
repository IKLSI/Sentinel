using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Constants;
using Sentinel.API.Attributes;
using Sentinel.Application.Jobs.GetRecurring;
using Sentinel.Application.Jobs.TriggerTechHealthScan;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Common.Contracts;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/jobs")]
[Authorize]
[AuthorizeRoles(UserRole.Admin)]
public class JobsController : BaseController
{
    [HttpGet]
    public ActionResult<List<RecurringJobStatusDto>> GetRecurringJobs(
        [FromServices] RecurringJobListService service,
        [FromQuery] JobSortField sortBy = JobSortField.Job,
        [FromQuery] SortDirection sortDirection = SortDirection.Asc) =>
        ToActionResult(service.Execute(sortBy, sortDirection));

    [HttpPost("tech-health-scan/trigger")]
    [EnableRateLimiting(RateLimitPolicies.Scan)]
    public async Task<ActionResult<ApiMessageResponse>> TriggerTechHealthScan(
        [FromServices] TechHealthScanTriggerService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));
}
