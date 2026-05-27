using Asp.Versioning;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.Constants;
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
    private readonly RepositoryHostClient _repositoryHostClient;
    private readonly TokenProtector _tokenProtector;
    private readonly QuotaService _quotaService;

    public TechHealthController(SentinelContext context, TechHealthService techHealthService, IBackgroundJobClient backgroundJobs, ExportService exportService, IAuditLogService auditLog, RepositoryHostClient repositoryHostClient, TokenProtector tokenProtector, QuotaService quotaService)
    {
        _context = context;
        _techHealthService = techHealthService;
        _backgroundJobs = backgroundJobs;
        _exportService = exportService;
        _auditLog = auditLog;
        _repositoryHostClient = repositoryHostClient;
        _tokenProtector = tokenProtector;
        _quotaService = quotaService;
    }

    [HttpGet("projects/available-repos")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<IEnumerable<AvailableRepoDto>>> GetAvailableRepos()
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        Organization? org = await _context.Organizations.FindAsync(organizationId.Value);

        if (org == null) return NotFound();

        List<string?> existingUrls = await _context.Projects
            .Where(p => p.OrganizationId == organizationId.Value)
            .Select(p => p.RepositoryUrl)
            .ToListAsync();

        bool hasToken = !string.IsNullOrEmpty(org.GithubToken) || !string.IsNullOrEmpty(org.GitlabToken);
        bool fetchFailed = false;
        List<AvailableRepoDto> result = new();

        if (!string.IsNullOrEmpty(org.GithubToken))
        {
            string? token = _tokenProtector.Unprotect(org.GithubToken);

            if (string.IsNullOrEmpty(token))
            {
                fetchFailed = true;
            }
            else
            {
                (bool success, List<(string Name, string Url)> repos) = await _repositoryHostClient.ListUserRepositoriesAsync(token, RepositoryType.GitHub.ToString().ToLower());

                if (!success) fetchFailed = true;

                foreach ((string name, string url) in repos)
                {
                    if (!existingUrls.Contains(url))
                        result.Add(new AvailableRepoDto { Name = name, Url = url, Platform = RepositoryType.GitHub.ToString() });
                }
            }
        }

        if (!string.IsNullOrEmpty(org.GitlabToken))
        {
            string? token = _tokenProtector.Unprotect(org.GitlabToken);

            if (string.IsNullOrEmpty(token))
            {
                fetchFailed = true;
            }
            else
            {
                (bool success, List<(string Name, string Url)> repos) = await _repositoryHostClient.ListUserRepositoriesAsync(token, RepositoryType.GitLab.ToString().ToLower());

                if (!success) fetchFailed = true;

                foreach ((string name, string url) in repos)
                {
                    if (!existingUrls.Contains(url))
                        result.Add(new AvailableRepoDto { Name = name, Url = url, Platform = RepositoryType.GitLab.ToString() });
                }
            }
        }

        return Ok(new AvailableReposResponse
        {
            Repos = result,
            HasToken = hasToken,
            FetchFailed = fetchFailed
        });
    }

    [HttpGet("projects/export/excel")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<IActionResult> ExportExcel()
    {
        Guid? organizationId = GetOrganizationId();
        Guid? userId = GetCurrentUserId();

        if (organizationId == null || userId == null) return Unauthorized();

        ExportResult export = await _exportService.ExportTechHealthExcelAsync(organizationId.Value, userId.Value);

        return File(export.Content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", export.FileName);
    }

    [HttpGet("projects")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer, UserRole.Client)]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        List<Project> projects = await _context.Projects
            .AsNoTracking()
            .AsSplitQuery()
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
            ProjectDto dto = TechHealthService.MapToDto(p);
            dto.TotalTickets = ticketCounts.GetValueOrDefault(p.Id);
            return dto;
        }));
    }

    [HttpGet("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer, UserRole.Client)]
    public async Task<ActionResult<ProjectDto>> GetProject(Guid id)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        ProjectDto? project = await _techHealthService.GetProjectWithDetailsAsync(id);

        if (project == null)
            return NotFound(new { message = "Projet introuvable" });

        bool belongs = await _context.Projects
            .AnyAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (!belongs) return Forbid();

        return Ok(project);
    }

    [HttpPost("projects")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectDto dto)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        if (!RepositoryUrlGuard.IsValid(dto.RepositoryUrl))
            return BadRequest(new { message = "URL de dépôt invalide. Hôtes autorisés : github.com, gitlab.com" });

        await _quotaService.EnsureCanAddProjectAsync(organizationId.Value);

        if (!Enum.TryParse<RepositoryType>(dto.RepositoryType, true, out RepositoryType repoType))
            repoType = RepositoryType.GitHub;

        if (!Enum.TryParse<ScanFrequency>(dto.ScanFrequency, true, out ScanFrequency scanFreq))
            scanFreq = ScanFrequency.Weekly;

        Project project = new Project
        {
            OrganizationId = organizationId.Value,
            Name = dto.Name,
            RepositoryUrl = dto.RepositoryUrl,
            RepositoryType = repoType,
            ScanFrequency = scanFreq,
            HealthScore = 100,
            HealthGrade = "A"
        };

        await _context.Projects.AddAsync(project);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.ProjectCreated,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId.Value,
            userId: GetCurrentUserId(),
            entityId: project.Id,
            jti: GetCurrentJti());

        ProjectDto? created = await _techHealthService.GetProjectWithDetailsAsync(project.Id);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, created);
    }

    [HttpDelete("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        Project? project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (project == null)
            return NotFound(new { message = "Projet introuvable" });

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.ProjectDeleted,
            entityType: AuditEntityTypes.Project,
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

        bool belongs = await _context.Projects
            .AnyAsync(p => p.Id == id && p.OrganizationId == organizationId.Value);

        if (!belongs)
            return NotFound(new { message = "Projet introuvable" });

        await _quotaService.EnsureCanScanAsync(organizationId.Value);

        _backgroundJobs.Enqueue<TechHealthService>(s => s.ScanProjectAsync(id));

        await _auditLog.LogAsync(
            AuditAction.ScanTriggered,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId.Value,
            userId: GetCurrentUserId(),
            entityId: id,
            jti: GetCurrentJti());

        return Accepted();
    }
}
