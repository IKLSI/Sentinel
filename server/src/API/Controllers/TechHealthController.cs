using Sentinel.API.Constants;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.Application.Common;
using Sentinel.Application.TechHealth.AvailableRepos;
using Sentinel.Application.TechHealth.ComplianceReport;
using Sentinel.Application.TechHealth.CreateProject;
using Sentinel.Application.TechHealth.DeleteProject;
using Sentinel.Application.TechHealth.ExportExcel;
using Sentinel.Application.TechHealth.ExportSbom;
using Sentinel.Application.TechHealth.GetProject;
using Sentinel.Application.TechHealth.Projects;
using Sentinel.Application.TechHealth.TriggerScan;
using Sentinel.Application.TechHealth.UpdateProject;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Application.TechHealth;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/tech-health")]
[Authorize]
public class TechHealthController : BaseController
{
    [HttpGet("projects/available-repos")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<AvailableReposResponse>> GetAvailableRepos(
        [FromServices] AvailableReposService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/export/excel")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportExcel(
        [FromServices] TechHealthExportExcelService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/{id:guid}/sbom")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<IActionResult> ExportSbom(
        Guid id,
        [FromQuery] string? format,
        [FromServices] ProjectSbomExportService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(id, format, cancellationToken));

    [HttpGet("projects/{id:guid}/compliance-report")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportComplianceReport(
        Guid id,
        [FromServices] ProjectComplianceReportService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpGet("projects")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<List<ProjectDto>>> GetProjects(
        [FromServices] ProjectListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<ProjectDto>> GetProject(
        Guid id,
        [FromServices] ProjectGetByIdService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("projects")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<ProjectDto>> CreateProject(
        [FromBody] CreateProjectDto dto,
        [FromServices] ProjectCreateService service,
        CancellationToken cancellationToken)
    {
        Result<ProjectDto> result = await service.ExecuteAsync(dto, cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetProject), new { id = result.Value!.Id }, result.Value)
            : ToActionResult(result);
    }

    [HttpPatch("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<ProjectScanFrequencyDto>> UpdateProject(
        Guid id,
        [FromBody] UpdateProjectDto dto,
        [FromServices] ProjectUpdateService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, dto, cancellationToken));

    [HttpDelete("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> DeleteProject(
        Guid id,
        [FromServices] ProjectDeleteService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("projects/{id:guid}/scan")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Scan)]
    public async Task<IActionResult> TriggerScan(
        Guid id,
        [FromServices] ProjectScanTriggerService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));
}
