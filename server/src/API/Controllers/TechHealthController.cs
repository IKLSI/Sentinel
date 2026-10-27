using Sentinel.API.Constants;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.Application.Common;
using Sentinel.Application.Projects.AvailableRepos;
using Sentinel.Application.Compliance;
using Sentinel.Application.Projects.Create;
using Sentinel.Application.Projects.Import;
using Sentinel.Application.Projects.Delete;
using Sentinel.Application.Projects.ExportExcel;
using Sentinel.Application.Sbom;
using Sentinel.Application.Projects.GetById;
using Sentinel.Application.Projects.Options;
using Sentinel.Application.Projects.Search;
using Sentinel.Application.Scanning.GetProgress;
using Sentinel.Application.Projects.Badge;
using Sentinel.Application.Projects.GetAll;
using Sentinel.Application.Remediation;
using Sentinel.Application.Remediation.Start;
using Sentinel.Application.Projects.RepositoryOptions;
using Sentinel.Application.Suppressions;
using Sentinel.Application.Suppressions.Remove;
using Sentinel.Application.Suppressions.Suppress;
using Sentinel.Application.Scanning.Trigger;
using Sentinel.Application.Projects.Update;
using Sentinel.Application.Projects.GetOverview;
using Sentinel.Application.Projects.ListDependencies;
using Sentinel.Domain.Entities;
using Sentinel.Application.Projects;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/tech-health")]
[AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
public class TechHealthController : BaseController
{
    [SkipConnectionScope]
    [HttpGet("projects/available-repos")]
    public async Task<ActionResult<AvailableReposResponse>> GetAvailableRepos(
        [FromServices] AvailableReposService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/export/excel")]
    [AllowApiKey]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportExcel(
        [FromServices] TechHealthExportExcelService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/{id:guid}/sbom")]
    [AllowApiKey]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportSbom(
        Guid id,
        [FromQuery] string? format,
        [FromServices] ProjectSbomExportService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(id, format, cancellationToken));

    [HttpGet("projects/{id:guid}/compliance-report")]
    [AllowApiKey]
    [EnableRateLimiting(RateLimitPolicies.Export)]
    public async Task<IActionResult> ExportComplianceReport(
        Guid id,
        [FromServices] ProjectComplianceReportService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpGet("projects")]
    [AllowApiKey]
    public async Task<ActionResult<List<ProjectSummaryDto>>> GetProjects(
        [FromServices] ProjectListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/scan-progress")]
    [SkipConnectionScope]
    [AllowApiKey]
    public async Task<ActionResult<List<ScanProgressDto>>> GetScanProgress(
        [FromServices] ScanProgressListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/search")]
    [AllowApiKey]
    public async Task<ActionResult<List<ProjectSearchMatchDto>>> SearchProjects(
        [FromQuery] ProjectSearchModel query,
        [FromServices] ProjectSearchService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(query, cancellationToken));

    [HttpGet("projects/options")]
    [AllowApiKey]
    public async Task<ActionResult<List<ProjectOptionDto>>> GetProjectOptions(
        [FromServices] ProjectOptionListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("projects/{id:guid}")]
    [AllowApiKey]
    public async Task<ActionResult<ProjectDto>> GetProject(
        Guid id,
        [FromServices] ProjectGetByIdService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpGet("projects/{id:guid}/overview")]
    public async Task<ActionResult<ProjectOverviewDto>> GetProjectOverview(
        Guid id,
        [FromServices] ProjectOverviewGetService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpGet("projects/{id:guid}/dependencies/without-vulnerabilities")]
    public async Task<ActionResult<List<DependencyDto>>> ListProjectDependenciesWithoutVulnerabilities(
        Guid id,
        [FromServices] ProjectDependenciesListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("projects")]
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
