using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Services;
using Sentinel.Domain.DTOs.Settings;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize]
public class SettingsController : BaseController
{
    private readonly SentinelContext _context;
    private readonly RepositoryHostClient _repositoryHostClient;

    public SettingsController(SentinelContext context, RepositoryHostClient repositoryHostClient)
    {
        _context = context;
        _repositoryHostClient = repositoryHostClient;
    }

    [HttpGet("integrations")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetIntegrationSettings()
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        return Ok(new IntegrationSettingsDto
        {
            HasGithubToken = !string.IsNullOrEmpty(org.GithubToken),
            HasGitlabToken = !string.IsNullOrEmpty(org.GitlabToken),
        });
    }

    [HttpPost("integrations/github")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConnectGithub([FromBody] ConnectIntegrationDto dto)
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Le token est requis" });

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        org.GithubToken = dto.Token;
        org.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        List<(string Name, string Url)> repos = await _repositoryHostClient.ListUserRepositoriesAsync(dto.Token, "github");

        List<string?> existingUrls = await _context.TechProjects
            .Where(p => p.OrganizationId == orgId.Value)
            .Select(p => p.RepositoryUrl)
            .ToListAsync();

        int imported = 0, skipped = 0;
        foreach ((string name, string url) in repos)
        {
            if (existingUrls.Contains(url)) { skipped++; continue; }
            _context.TechProjects.Add(new TechProject
            {
                OrganizationId = orgId.Value,
                Name = name,
                RepositoryUrl = url,
                RepositoryType = RepositoryType.GitHub,
                ScanFrequency = ScanFrequency.Weekly,
                HealthScore = 100,
                HealthGrade = "A",
            });
            imported++;
        }

        if (imported > 0)
            await _context.SaveChangesAsync();

        return Ok(new ImportResultDto { ImportedCount = imported, SkippedCount = skipped });
    }

    [HttpPost("integrations/gitlab")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConnectGitlab([FromBody] ConnectIntegrationDto dto)
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Le token est requis" });

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        org.GitlabToken = dto.Token;
        org.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        List<(string Name, string Url)> repos = await _repositoryHostClient.ListUserRepositoriesAsync(dto.Token, "gitlab");

        List<string?> existingUrls = await _context.TechProjects
            .Where(p => p.OrganizationId == orgId.Value)
            .Select(p => p.RepositoryUrl)
            .ToListAsync();

        int imported = 0, skipped = 0;
        foreach ((string name, string url) in repos)
        {
            if (existingUrls.Contains(url)) { skipped++; continue; }
            _context.TechProjects.Add(new TechProject
            {
                OrganizationId = orgId.Value,
                Name = name,
                RepositoryUrl = url,
                RepositoryType = RepositoryType.GitLab,
                ScanFrequency = ScanFrequency.Weekly,
                HealthScore = 100,
                HealthGrade = "A",
            });
            imported++;
        }

        if (imported > 0)
            await _context.SaveChangesAsync();

        return Ok(new ImportResultDto { ImportedCount = imported, SkippedCount = skipped });
    }

    [HttpGet("organization")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetOrganizationSettings()
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        return Ok(new OrganizationSettingsDto
        {
            Name = org.Name,
            Slug = org.Slug,
            Timezone = org.Timezone,
            CreatedAt = org.CreatedAt,
        });
    }

    [HttpPut("organization")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateOrganizationSettings([FromBody] UpdateOrganizationSettingsDto dto)
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Le nom de l'organisation est requis" });

        org.Name = dto.Name.Trim();
        org.Timezone = dto.Timezone;
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new OrganizationSettingsDto
        {
            Name = org.Name,
            Slug = org.Slug,
            Timezone = org.Timezone,
            CreatedAt = org.CreatedAt,
        });
    }

}
