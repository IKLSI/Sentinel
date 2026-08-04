using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/dashboard")]
[Route("api/v{version:apiVersion}/dashboard")]
[AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
public class DashboardController : BaseController
{
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(
        [FromServices] DashboardStatsService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));
}
