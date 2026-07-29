using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Application.Services;
using Sentinel.Domain.Constants;
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
            return BadRequestCode(ErrorCodes.SettingsTokenRequired);

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);

        if (org == null) return NotFound();

        (string Id, string Login)? account = await _repositoryHostClient.GetAuthenticatedAccountAsync(dto.Token, "github");

        if (account == null)
            return BadRequestCode(ErrorCodes.SettingsInvalidGithubToken);

        org.GithubToken = _tokenProtector.Protect(dto.Token);
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.GithubIntegrationSaved,
            entityType: AuditEntityTypes.Organization,
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
            return BadRequestCode(ErrorCodes.SettingsTokenRequired);

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);

        if (org == null) return NotFound();

        (string Id, string Login)? account = await _repositoryHostClient.GetAuthenticatedAccountAsync(dto.Token, "gitlab");

        if (account == null)
            return BadRequestCode(ErrorCodes.SettingsInvalidGitlabToken);

        org.GitlabToken = _tokenProtector.Protect(dto.Token);
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.GitlabIntegrationSaved,
            entityType: AuditEntityTypes.Organization,
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
            SecurityAlertsEnabled = org.SecurityAlertsEnabled,
            AlertMinSeverity = org.AlertMinSeverity,
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
            return BadRequestCode(ErrorCodes.SettingsOrganizationNameRequired);

        org.Name = dto.Name.Trim();
        org.SecurityAlertsEnabled = dto.SecurityAlertsEnabled;
        org.AlertMinSeverity = dto.AlertMinSeverity;
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.OrganizationUpdated,
            entityType: AuditEntityTypes.Organization,
            organizationId: orgId.Value,
            userId: GetCurrentUserId(),
            entityId: orgId.Value,
            jti: GetCurrentJti());

        return Ok(new OrganizationSettingsDto
        {
            Name = org.Name,
            Slug = org.Slug,
            SecurityAlertsEnabled = org.SecurityAlertsEnabled,
            AlertMinSeverity = org.AlertMinSeverity,
            CreatedAt = org.CreatedAt,
        });
    }
}
