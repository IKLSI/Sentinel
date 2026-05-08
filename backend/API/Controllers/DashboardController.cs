using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Admin,Developer")]
public class DashboardController : BaseController
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null || organizationId == Guid.Empty)
        {
            return Unauthorized();
        }

        DashboardStatsDto stats = await _dashboardService.GetStatsAsync(organizationId.Value);

        return Ok(stats);
    }

}
