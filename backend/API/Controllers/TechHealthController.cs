using Asp.Versioning;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

internal static class RepositoryUrlGuard
{
    private static readonly HashSet<string> AllowedHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "github.com",
        "www.github.com",
        "gitlab.com",
        "www.gitlab.com",
    };

    public static bool IsValid(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri)) return false;
        if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp) return false;
        return AllowedHosts.Contains(uri.Host);
    }
}

[ApiController]
[ApiVersion("1.0")]
[Route("api/tech-health")]
[Route("api/v{version:apiVersion}/tech-health")]
[Authorize]
public class TechHealthController : BaseController
{
    private readonly SentinelContext _context;
    private readonly TechHealthService _techHealthService;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly ExportService _exportService;
    private readonly IAuditLogService _auditLog;

    public TechHealthController(SentinelContext context, TechHealthService techHealthService, IBackgroundJobClient backgroundJobs, ExportService exportService, IAuditLogService auditLog)
    {
        _context = context;
        _techHealthService = techHealthService;
        _backgroundJobs = backgroundJobs;
        _exportService = exportService;
        _auditLog = auditLog;
    }

    [HttpGet("projects/export/excel")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<IActionResult> ExportExcel()
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();
        byte[] bytes = await _exportService.ExportTechHealthExcelAsync(organizationId.Value);
        string filename = $"techhealth-{DateTime.Now:yyyy-MM-dd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    [HttpGet("projects")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer, UserRole.Client)]
    public async Task<ActionResult<IEnumerable<TechProjectDto>>> GetProjects()
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        List<TechProject> projects = await _context.TechProjects
            .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
            .Include(p => p.Runtimes)
            .Where(p => p.OrganizationId == organizationId.Value)
            .OrderByDescending(p => p.Dependencies.Any(d => d.Vulnerabilities.Any(v => v.Severity == VulnerabilitySeverity.Critical)))
            .ThenBy(p => p.HealthScore)
            .ThenBy(p => p.Name)
            .ToListAsync();

        List<Guid> projectIds = projects.Select(p => p.Id).ToList();
        Dictionary<Guid, int> ticketCounts = await _context.Tickets
            .Where(t => t.ProjectId != null && projectIds.Contains(t.ProjectId.Value))
            .GroupBy(t => t.ProjectId!.Value)
            .Select(g => new { ProjectId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProjectId, x => x.Count);

        return Ok(projects.Select(p =>
        {
            TechProjectDto dto = TechHealthService.MapToDto(p);
            dto.TotalTickets = ticketCounts.GetValueOrDefault(p.Id);
            return dto;
        }));
    }

    [HttpGet("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer, UserRole.Client)]
    public async Task<ActionResult<TechProjectDto>> GetProject(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        TechProjectDto? project = await _techHealthService.GetProjectWithDetailsAsync(id);

        if (project == null)
            return NotFound(new { message = "Projet introuvable" });

        bool belongs = await _context.TechProjects
            .AnyAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (!belongs) return Forbid();

        return Ok(project);
    }

    [HttpPost("projects")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<TechProjectDto>> CreateProject([FromBody] CreateTechProjectDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        if (!RepositoryUrlGuard.IsValid(dto.RepositoryUrl))
            return BadRequest(new { message = "URL de dépôt invalide. Hôtes autorisés : github.com, gitlab.com" });

        if (!Enum.TryParse<RepositoryType>(dto.RepositoryType, true, out RepositoryType repoType))
            repoType = RepositoryType.GitHub;

        if (!Enum.TryParse<ScanFrequency>(dto.ScanFrequency, true, out ScanFrequency scanFreq))
            scanFreq = ScanFrequency.Weekly;

        TechProject project = new TechProject
        {
            OrganizationId = organizationId.Value,
            Name = dto.Name,
            RepositoryUrl = dto.RepositoryUrl,
            RepositoryType = repoType,
            ScanFrequency = scanFreq,
            HealthScore = 100,
            HealthGrade = "A"
        };

        await _context.TechProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.ProjectCreated,
            entityType: "TechProject",
            organizationId: organizationId.Value,
            userId: GetCurrentUserId(),
            entityId: project.Id,
            jti: GetCurrentJti());

        TechProjectDto? created = await _techHealthService.GetProjectWithDetailsAsync(project.Id);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, created);
    }

    [HttpPut("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<TechProjectDto>> UpdateProject(Guid id, [FromBody] UpdateTechProjectDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        TechProject? project = await _context.TechProjects
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (project == null)
            return NotFound(new { message = "Projet introuvable" });

        if (dto.RepositoryUrl != null && !string.IsNullOrEmpty(dto.RepositoryUrl) && !RepositoryUrlGuard.IsValid(dto.RepositoryUrl))
            return BadRequest(new { message = "URL de dépôt invalide. Hôtes autorisés : github.com, gitlab.com" });

        if (!string.IsNullOrEmpty(dto.Name)) project.Name = dto.Name;
        if (dto.RepositoryUrl != null) project.RepositoryUrl = string.IsNullOrEmpty(dto.RepositoryUrl) ? null : dto.RepositoryUrl;

        if (!string.IsNullOrEmpty(dto.RepositoryType) && Enum.TryParse<RepositoryType>(dto.RepositoryType, true, out RepositoryType repoType))
            project.RepositoryType = repoType;

        if (!string.IsNullOrEmpty(dto.ScanFrequency) && Enum.TryParse<ScanFrequency>(dto.ScanFrequency, true, out ScanFrequency scanFreq))
            project.ScanFrequency = scanFreq;

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.ProjectUpdated,
            entityType: "TechProject",
            organizationId: organizationId.Value,
            userId: GetCurrentUserId(),
            entityId: id,
            jti: GetCurrentJti());

        TechProjectDto? updated = await _techHealthService.GetProjectWithDetailsAsync(id);
        return Ok(updated);
    }

    [HttpDelete("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        TechProject? project = await _context.TechProjects
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (project == null)
            return NotFound(new { message = "Projet introuvable" });

        _context.TechProjects.Remove(project);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.ProjectDeleted,
            entityType: "TechProject",
            organizationId: organizationId.Value,
            userId: GetCurrentUserId(),
            entityId: id,
            jti: GetCurrentJti());

        return NoContent();
    }

    [HttpPost("projects/{id:guid}/scan")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<IActionResult> TriggerScan(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool belongs = await _context.TechProjects
            .AnyAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (!belongs)
            return NotFound(new { message = "Projet introuvable" });

        _backgroundJobs.Enqueue<TechHealthService>(s => s.ScanProjectAsync(id));

        await _auditLog.LogAsync(
            AuditAction.ScanTriggered,
            entityType: "TechProject",
            organizationId: organizationId.Value,
            userId: GetCurrentUserId(),
            entityId: id,
            jti: GetCurrentJti());

        return Accepted();
    }

}
