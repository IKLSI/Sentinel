using Sentinel.API.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.Application.Common;
using Sentinel.Application.TechHealth.AvailableRepos;
using Sentinel.Application.TechHealth.ComplianceReport;
using Sentinel.Application.TechHealth.CreateProject;
using Sentinel.Application.TechHealth.ImportProjects;
using Sentinel.Application.TechHealth.DeleteProject;
using Sentinel.Application.TechHealth.ExportExcel;
using Sentinel.Application.TechHealth.ExportSbom;
using Sentinel.Application.TechHealth.GetProject;
using Sentinel.Application.TechHealth.ProjectOptions;
using Sentinel.Application.TechHealth.ProjectSearch;
using Sentinel.Application.TechHealth.ProjectBadge;
using Sentinel.Application.TechHealth.Projects;
using Sentinel.Application.TechHealth.Remediation;
using Sentinel.Application.TechHealth.Remediation.StartRemediation;
using Sentinel.Application.TechHealth.RepositoryOptions;
using Sentinel.Application.TechHealth.Suppressions;
using Sentinel.Application.TechHealth.Suppressions.RemoveSuppression;
using Sentinel.Application.TechHealth.Suppressions.SuppressVulnerability;
using Sentinel.Application.TechHealth.TriggerScan;
using Sentinel.Application.TechHealth.UpdateProject;
using Sentinel.Domain.Entities;
using Sentinel.Application.TechHealth;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/tech-health")]
[Authorize]
public class TechHealthController : BaseController
{
    [SkipConnectionScope]
    [HttpGet("projects/available-repos")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<AvailableReposResponse>> GetAvailableRepos(
        [FromServices] AvailableReposService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/export/excel")]
    [AllowApiKey]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportExcel(
        [FromServices] TechHealthExportExcelService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/{id:guid}/sbom")]
    [AllowApiKey]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportSbom(
        Guid id,
        [FromQuery] string? format,
        [FromServices] ProjectSbomExportService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(id, format, cancellationToken));

    [HttpGet("projects/{id:guid}/compliance-report")]
    [AllowApiKey]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportComplianceReport(
        Guid id,
        [FromServices] ProjectComplianceReportService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpGet("projects")]
    [AllowApiKey]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<List<ProjectSummaryDto>>> GetProjects(
        [FromServices] ProjectListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/search")]
    [AllowApiKey]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<List<ProjectSearchMatchDto>>> SearchProjects(
        [FromQuery] ProjectSearchModel query,
        [FromServices] ProjectSearchService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(query, cancellationToken));

    [HttpGet("projects/options")]
    [AllowApiKey]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<List<ProjectOptionDto>>> GetProjectOptions(
        [FromServices] ProjectOptionListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/{id:guid}")]
    [AllowApiKey]
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

    [HttpPost("projects/import")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<List<ProjectDto>>> ImportProjects(
        [FromBody] ImportProjectsDto dto,
        [FromServices] ProjectImportService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));

    [HttpPatch("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<ProjectScanSettingsDto>> UpdateProject(
        Guid id,
        [FromBody] UpdateProjectDto dto,
        [FromServices] ProjectUpdateService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, dto, cancellationToken));

    [SkipConnectionScope]
    [HttpGet("projects/{id:guid}/repository-options")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<ProjectRepositoryOptionsDto>> GetRepositoryOptions(
        Guid id,
        [FromQuery] string? branch,
        [FromServices] ProjectRepositoryOptionsService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, branch, cancellationToken));

    [HttpDelete("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> DeleteProject(
        Guid id,
        [FromServices] ProjectDeleteService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("projects/{id:guid}/scan")]
    [AllowApiKey]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Scan)]
    public async Task<IActionResult> TriggerScan(
        Guid id,
        [FromServices] ProjectScanTriggerService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("projects/{id:guid}/suppressions")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<SuppressionDto>> SuppressVulnerability(
        Guid id,
        [FromBody] SuppressVulnerabilityDto dto,
        [FromServices] SuppressVulnerabilityService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, dto, cancellationToken));

    [HttpDelete("projects/{id:guid}/suppressions/{suppressionId:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> RemoveSuppression(
        Guid id,
        Guid suppressionId,
        [FromServices] RemoveSuppressionService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, suppressionId, cancellationToken));

    [SkipConnectionScope]
    [HttpPost("projects/{id:guid}/remediations")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<RemediationDto>> StartRemediation(
        Guid id,
        [FromServices] StartRemediationService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("projects/{id:guid}/badge")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<ProjectBadgeDto>> EnableProjectBadge(
        Guid id,
        [FromServices] ProjectBadgeEnableService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));
}
