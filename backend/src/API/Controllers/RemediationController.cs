using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Application.Services;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/remediation")]
[Route("api/v{version:apiVersion}/remediation")]
[Authorize]
public class RemediationController : BaseController
{
    private readonly SentinelContext _context;
    private readonly RemediationService _remediationService;
    private readonly IAuditLogService _auditLog;

    public RemediationController(SentinelContext context, RemediationService remediationService, IAuditLogService auditLog)
    {
        _context = context;
        _remediationService = remediationService;
        _auditLog = auditLog;
    }

    [HttpGet("projects/{id:guid}/preview")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<RemediationPreviewDto>> Preview(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        if (!await ProjectBelongsAsync(id, organizationId.Value))
            return NotFoundCode(ErrorCodes.ProjectNotFound);

        RemediationPreviewDto preview = await _remediationService.PreviewAsync(id);
        return Ok(preview);
    }

    [HttpPost("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    [EnableRateLimiting(RateLimitPolicies.Scan)]
    public async Task<ActionResult<RemediationResultDto>> Execute(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        if (!await ProjectBelongsAsync(id, organizationId.Value))
            return NotFoundCode(ErrorCodes.ProjectNotFound);

        await EnsureSubscriptionActiveAsync(organizationId.Value);

        RemediationResultDto result = await _remediationService.ExecuteAsync(id, organizationId.Value, GetCurrentUserId());

        await _auditLog.LogAsync(
            AuditAction.RemediationRequested,
            entityType: AuditEntityTypes.Remediation,
            organizationId: organizationId.Value,
            userId: GetCurrentUserId(),
            entityId: result.Id,
            jti: GetCurrentJti());

        return Ok(result);
    }

    [HttpGet("projects/{id:guid}")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<IEnumerable<RemediationHistoryDto>>> History(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        if (!await ProjectBelongsAsync(id, organizationId.Value))
            return NotFoundCode(ErrorCodes.ProjectNotFound);

        List<RemediationHistoryDto> history = await _context.RemediationRequests
            .AsNoTracking()
            .Where(r => r.ProjectId == id)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RemediationHistoryDto
            {
                Id = r.Id,
                Status = r.Status.ToString(),
                PullRequestUrl = r.PullRequestUrl,
                DependenciesPatched = r.DependenciesPatched,
                HasBreakingChanges = r.HasBreakingChanges,
                Error = r.Error,
                CreatedAt = r.CreatedAt,
                CompletedAt = r.CompletedAt
            })
            .ToListAsync();

        return Ok(history);
    }

    private Task<bool> ProjectBelongsAsync(Guid projectId, Guid organizationId)
        => _context.Projects.AnyAsync(p => p.Id == projectId && p.OrganizationId == organizationId);

    private async Task EnsureSubscriptionActiveAsync(Guid organizationId)
    {
        SubscriptionStatus status = await _context.Organizations
            .Where(o => o.Id == organizationId)
            .Select(o => o.SubscriptionStatus)
            .FirstOrDefaultAsync();

        if (status is not (SubscriptionStatus.Active or SubscriptionStatus.Trialing))
            throw new QuotaExceededException(ErrorCodes.QuotaRemediationsExceeded);
    }
}
