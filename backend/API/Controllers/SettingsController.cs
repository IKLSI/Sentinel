using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sentinel.API.Attributes;
using Sentinel.Application.Services;
using Sentinel.Domain.DTOs.Settings;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/settings")]
[Route("api/v{version:apiVersion}/settings")]
[Authorize]
public class SettingsController : BaseController
{
    private readonly SentinelContext _context;
    private readonly RepositoryHostClient _repositoryHostClient;
    private readonly TokenProtector _tokenProtector;
    private readonly IAuditLogService _auditLog;

    public SettingsController(SentinelContext context, RepositoryHostClient repositoryHostClient, TokenProtector tokenProtector, IAuditLogService auditLog)
    {
        _context = context;
        _repositoryHostClient = repositoryHostClient;
        _tokenProtector = tokenProtector;
        _auditLog = auditLog;
    }

    [HttpGet("integrations")]
    [AuthorizeRoles(UserRole.Admin)]
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
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> ConnectGithub([FromBody] ConnectIntegrationDto dto)
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Le token est requis" });

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        (string Id, string Login)? account = await _repositoryHostClient.GetAuthenticatedAccountAsync(dto.Token, "github");
        if (account == null)
            return BadRequest(new { message = "Le token GitHub est invalide ou ne peut pas être vérifié auprès du fournisseur" });

        org.GithubToken = _tokenProtector.Protect(dto.Token);
        org.GithubAccountId = account.Value.Id;
        org.GithubAccountLogin = account.Value.Login;
        org.GithubConnectedAt = DateTime.UtcNow;
        org.GithubConnectedById = GetCurrentUserId();
        org.UpdatedAt = DateTime.UtcNow;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            return Conflict(new { message = "Ce compte GitHub est déjà associé à une autre organisation" });
        }

        await _auditLog.LogAsync(
            AuditAction.GithubIntegrationSaved,
            entityType: "Organization",
            organizationId: orgId.Value,
            userId: GetCurrentUserId(),
            entityId: orgId.Value,
            jti: GetCurrentJti());

        return NoContent();
    }

    [HttpPost("integrations/gitlab")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> ConnectGitlab([FromBody] ConnectIntegrationDto dto)
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Le token est requis" });

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        (string Id, string Login)? account = await _repositoryHostClient.GetAuthenticatedAccountAsync(dto.Token, "gitlab");
        if (account == null)
            return BadRequest(new { message = "Le token GitLab est invalide ou ne peut pas être vérifié auprès du fournisseur" });

        org.GitlabToken = _tokenProtector.Protect(dto.Token);
        org.GitlabAccountId = account.Value.Id;
        org.GitlabAccountLogin = account.Value.Login;
        org.GitlabConnectedAt = DateTime.UtcNow;
        org.GitlabConnectedById = GetCurrentUserId();
        org.UpdatedAt = DateTime.UtcNow;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            return Conflict(new { message = "Ce compte GitLab est déjà associé à une autre organisation" });
        }

        await _auditLog.LogAsync(
            AuditAction.GitlabIntegrationSaved,
            entityType: "Organization",
            organizationId: orgId.Value,
            userId: GetCurrentUserId(),
            entityId: orgId.Value,
            jti: GetCurrentJti());

        return NoContent();
    }

    [HttpGet("organization")]
    [AuthorizeRoles(UserRole.Admin)]
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
    [AuthorizeRoles(UserRole.Admin)]
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

        await _auditLog.LogAsync(
            AuditAction.OrganizationUpdated,
            entityType: "Organization",
            organizationId: orgId.Value,
            userId: GetCurrentUserId(),
            entityId: orgId.Value,
            jti: GetCurrentJti());

        return Ok(new OrganizationSettingsDto
        {
            Name = org.Name,
            Slug = org.Slug,
            Timezone = org.Timezone,
            CreatedAt = org.CreatedAt,
        });
    }

}
