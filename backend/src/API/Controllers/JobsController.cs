using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Jobs.GetRecurring;
using Sentinel.Application.Jobs.TriggerTechHealthScan;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.DTOs.Jobs;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/jobs")]
[Route("api/v{version:apiVersion}/jobs")]
[Authorize]
[AuthorizeRoles(UserRole.Admin)]
public class JobsController : BaseController
{
    [HttpGet]
    public ActionResult<List<RecurringJobStatusDto>> GetRecurringJobs([FromServices] RecurringJobListService service) =>
        ToActionResult(service.Execute());

    [HttpPost("tech-health-scan/trigger")]
    public ActionResult<ApiMessageResponse> TriggerTechHealthScan([FromServices] TechHealthScanTriggerService service) =>
        ToActionResult(service.Execute());
}
