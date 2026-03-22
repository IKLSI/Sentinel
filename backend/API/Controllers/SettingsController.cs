using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    public SettingsController(SentinelContext context)
    {
        _context = context;
    }

    [HttpGet("sla")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSlaSettings()
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        return Ok(new SlaSettingsDto
        {
            CriticalHours = org.SlaCriticalHours,
            HighHours = org.SlaHighHours,
            MediumHours = org.SlaMediumHours,
            LowHours = org.SlaLowHours,
        });
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

    [HttpPut("sla")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSlaSettings([FromBody] UpdateSlaSettingsDto dto)
    {
        Guid? orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized();

        Organization? org = await _context.Organizations.FindAsync(orgId.Value);
        if (org == null) return NotFound();

        if (dto.CriticalHours <= 0 || dto.HighHours <= 0 || dto.MediumHours <= 0 || dto.LowHours <= 0)
            return BadRequest(new { message = "Les délais SLA doivent être supérieurs à 0" });

        org.SlaCriticalHours = dto.CriticalHours;
        org.SlaHighHours = dto.HighHours;
        org.SlaMediumHours = dto.MediumHours;
        org.SlaLowHours = dto.LowHours;
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new SlaSettingsDto
        {
            CriticalHours = org.SlaCriticalHours,
            HighHours = org.SlaHighHours,
            MediumHours = org.SlaMediumHours,
            LowHours = org.SlaLowHours,
        });
    }
}
