using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/dashboard")]
[Route("api/v{version:apiVersion}/dashboard")]
[AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
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
