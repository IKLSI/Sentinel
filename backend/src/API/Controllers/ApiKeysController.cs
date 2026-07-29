using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Services;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.ApiKeys;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/settings/api-keys")]
[Route("api/v{version:apiVersion}/settings/api-keys")]
[Authorize]
[AuthorizeRoles(UserRole.Admin)]
public class ApiKeysController : BaseController
{
    private readonly ApiKeyService _apiKeyService;
    private readonly IAuditLogService _auditLog;

    public ApiKeysController(ApiKeyService apiKeyService, IAuditLogService auditLog)
    {
        _apiKeyService = apiKeyService;
        _auditLog = auditLog;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        List<ApiKeyDto> keys = await _apiKeyService.ListAsync(orgId.Value);
        return Ok(keys);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateApiKeyDto dto)
    {
        Guid? orgId = GetOrganizationId();
        Guid? userId = GetCurrentUserId();

        if (orgId == null || userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequestCode(ErrorCodes.ApiKeyNameRequired);

        if (dto.Name.Length > 100)
            return BadRequestCode(ErrorCodes.ApiKeyNameTooLong, new Dictionary<string, string> { ["maxLength"] = "100" });

        CreatedApiKeyDto created = await _apiKeyService.CreateAsync(orgId.Value, userId.Value, dto);

        await _auditLog.LogAsync(
            AuditAction.ApiKeyCreated,
            entityType: AuditEntityTypes.ApiKey,
            organizationId: orgId.Value,
            userId: userId,
            entityId: created.Id,
            jti: GetCurrentJti());

        return Ok(created);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(Guid id)
    {
        Guid? orgId = GetOrganizationId();
        Guid? userId = GetCurrentUserId();

        if (orgId == null || userId == null) return Unauthorized();

        bool revoked = await _apiKeyService.RevokeAsync(orgId.Value, id);
        if (!revoked) return NotFound();

        await _auditLog.LogAsync(
            AuditAction.ApiKeyRevoked,
            entityType: AuditEntityTypes.ApiKey,
            organizationId: orgId.Value,
            userId: userId,
            entityId: id,
            jti: GetCurrentJti());

        return NoContent();
    }
}
