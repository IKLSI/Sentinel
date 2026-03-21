using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
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

    private Guid? GetOrganizationId()
    {
        string? claim = User.FindFirst("organizationId")?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }
}
