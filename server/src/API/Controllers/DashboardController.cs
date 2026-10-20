using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Entities;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
public class DashboardController : BaseController
{
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(
        [FromServices] DashboardStatsService service,
        CancellationToken cancellationToken,
        [FromQuery] DashboardPeriod period = DashboardPeriod.Month) =>
        ToActionResult(await service.ExecuteAsync(new DashboardStatsRequest { Period = period }, cancellationToken));
}
