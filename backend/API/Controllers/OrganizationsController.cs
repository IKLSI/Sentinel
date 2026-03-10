using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.Organizations;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/organizations")]
[Authorize]
public class OrganizationsController : ControllerBase
{
    private readonly TMAflowContext _context;
    private readonly AuditService _auditService;

    public OrganizationsController(TMAflowContext context, AuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentOrganization()
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Organization? org = await _context.Organizations
            .Include(o => o.Users.Where(u => u.IsActive))
            .FirstOrDefaultAsync(o => o.Id == organizationId.Value);

        if (org == null)
            return NotFound(new { message = "Organisation introuvable" });

        return Ok(new
        {
            org.Id,
            org.Name,
            org.Slug,
            org.LogoUrl,
            org.Timezone,
            org.CreatedAt,
            UserCount = org.Users.Count
        });
    }

    [HttpPut("current")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateOrganization([FromBody] UpdateOrganizationDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        Guid? userId = GetCurrentUserId();
        if (organizationId == null || userId == null) return Unauthorized();

        Organization? org = await _context.Organizations.FindAsync(organizationId.Value);
        if (org == null) return NotFound(new { message = "Organisation introuvable" });

        if (!string.IsNullOrEmpty(dto.Name)) org.Name = dto.Name;
        if (!string.IsNullOrEmpty(dto.LogoUrl)) org.LogoUrl = dto.LogoUrl;
        if (!string.IsNullOrEmpty(dto.Timezone)) org.Timezone = dto.Timezone;
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(userId, "UPDATE", "Organization", organizationId);

        return Ok(new { org.Id, org.Name, org.Slug, org.LogoUrl, org.Timezone });
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
