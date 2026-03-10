using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.TechHealth;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/tech-health")]
[Authorize]
public class TechHealthController : ControllerBase
{
    private readonly TMAflowContext _context;
    private readonly TechHealthService _techHealthService;
    private readonly AuditService _auditService;

    public TechHealthController(TMAflowContext context, TechHealthService techHealthService, AuditService auditService)
    {
        _context = context;
        _techHealthService = techHealthService;
        _auditService = auditService;
    }

    [HttpGet("projects")]
    public async Task<ActionResult<IEnumerable<TechProjectDto>>> GetProjects()
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        List<TechProject> projects = await _context.TechProjects
            .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
            .Include(p => p.Runtimes)
            .Where(p => p.OrganizationId == organizationId.Value)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(projects.Select(TechHealthService.MapToDto));
    }

    [HttpGet("projects/{id:guid}")]
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
    [Authorize(Roles = "Admin,Manager,Developer")]
    public async Task<ActionResult<TechProjectDto>> CreateProject([FromBody] CreateTechProjectDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

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

        TechProjectDto? created = await _techHealthService.GetProjectWithDetailsAsync(project.Id);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, created);
    }

    [HttpPut("projects/{id:guid}")]
    [Authorize(Roles = "Admin,Manager,Developer")]
    public async Task<ActionResult<TechProjectDto>> UpdateProject(Guid id, [FromBody] UpdateTechProjectDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        TechProject? project = await _context.TechProjects
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (project == null)
            return NotFound(new { message = "Projet introuvable" });

        if (!string.IsNullOrEmpty(dto.Name)) project.Name = dto.Name;
        if (dto.RepositoryUrl != null) project.RepositoryUrl = string.IsNullOrEmpty(dto.RepositoryUrl) ? null : dto.RepositoryUrl;

        if (!string.IsNullOrEmpty(dto.RepositoryType) && Enum.TryParse<RepositoryType>(dto.RepositoryType, true, out RepositoryType repoType))
            project.RepositoryType = repoType;

        if (!string.IsNullOrEmpty(dto.ScanFrequency) && Enum.TryParse<ScanFrequency>(dto.ScanFrequency, true, out ScanFrequency scanFreq))
            project.ScanFrequency = scanFreq;

        await _context.SaveChangesAsync();

        TechProjectDto? updated = await _techHealthService.GetProjectWithDetailsAsync(id);
        return Ok(updated);
    }

    [HttpDelete("projects/{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
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

        return NoContent();
    }

    [HttpPost("projects/{id:guid}/scan")]
    [Authorize(Roles = "Admin,Manager,Developer")]
    public async Task<IActionResult> TriggerScan(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool belongs = await _context.TechProjects
            .AnyAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (!belongs)
            return NotFound(new { message = "Projet introuvable" });

        await _techHealthService.ScanProjectAsync(id);
        TechProjectDto? updated = await _techHealthService.GetProjectWithDetailsAsync(id);

        Guid? currentUserId = GetCurrentUserId();
        await _auditService.LogAsync(currentUserId, "TECHHEALTH_SCAN_TRIGGERED", "TechProject", id);

        return Ok(updated);
    }

    [HttpPost("projects/{id:guid}/dependencies")]
    [Authorize(Roles = "Admin,Manager,Developer")]
    public async Task<IActionResult> AddDependency(Guid id, [FromBody] AddDependencyDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        TechProject? project = await _context.TechProjects
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (project == null)
            return NotFound(new { message = "Projet introuvable" });

        if (!Enum.TryParse<DependencyType>(dto.Type, true, out DependencyType depType))
            depType = DependencyType.Prod;

        if (!Enum.TryParse<DependencyEcosystem>(dto.Ecosystem, true, out DependencyEcosystem ecosystem))
            ecosystem = DependencyEcosystem.Npm;

        Dependency dependency = new Dependency
        {
            TechProjectId = id,
            Name = dto.Name,
            CurrentVersion = dto.CurrentVersion,
            LatestVersion = dto.LatestVersion,
            Type = depType,
            Ecosystem = ecosystem,
            Status = DependencyStatus.UpToDate,
            ScannedAt = DateTime.UtcNow
        };

        await _context.Dependencies.AddAsync(dependency);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProject), new { id }, new { dependency.Id, dependency.Name });
    }

    private Guid? GetCurrentUserId()
    {
        string? claim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }

    private Guid? GetOrganizationId()
    {
        string? claim = User.FindFirst("organizationId")?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }
}
