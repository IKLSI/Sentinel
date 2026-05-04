using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Sentinel.Domain.DTOs.TimeEntries;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize]
public class TimeEntriesController : BaseController
{
    private readonly TimeTrackingService _timeTrackingService;
    private readonly ExportService _exportService;
    private readonly IAuditLogService _auditLog;

    public TimeEntriesController(TimeTrackingService timeTrackingService, ExportService exportService, IAuditLogService auditLog)
    {
        _timeTrackingService = timeTrackingService;
        _exportService = exportService;
        _auditLog = auditLog;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TimeEntryDto>>> GetEntries(
        [FromQuery] Guid? userId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Guid? filterUserId = IsAdmin() ? userId : GetCurrentUserId();

        List<TimeEntryDto> entries = await _timeTrackingService.GetEntriesAsync(
            organizationId.Value, filterUserId, from, to);

        return Ok(entries);
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromQuery] Guid? userId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Guid? filterUserId = IsAdmin() ? userId : GetCurrentUserId();

        byte[] bytes = await _exportService.ExportTimeEntriesExcelAsync(organizationId.Value, filterUserId, from, to);
        string fromStr = from?.ToString("yyyy-MM-dd") ?? "debut";
        string toStr = to?.ToString("yyyy-MM-dd") ?? "fin";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"temps-{fromStr}-{toStr}.xlsx");
    }

    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> CreateEntry([FromBody] CreateTimeEntryDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();
        if (currentUserId == null || organizationId == null) return Unauthorized();

        TimeEntry entry = await _timeTrackingService.CreateManualEntryAsync(dto, currentUserId.Value, organizationId.Value);
        TimeEntryDto entryDto = TimeTrackingService.MapToDto(entry);

        await _auditLog.LogAsync(
            AuditAction.TimeEntryCreated,
            entityType: "TimeEntry",
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: entry.Id,
            jti: GetCurrentJti());

        return CreatedAtAction(nameof(GetEntries), entryDto);
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<TimeEntryDto>> UpdateEntry(Guid id, [FromBody] UpdateTimeEntryDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();
        if (currentUserId == null || organizationId == null) return Unauthorized();

        TimeEntry? entry = await _timeTrackingService.UpdateEntryAsync(id, dto, currentUserId.Value, organizationId.Value, IsAdmin());
        if (entry == null) return NotFound(new { message = "Saisie introuvable" });

        await _auditLog.LogAsync(
            AuditAction.TimeEntryUpdated,
            entityType: "TimeEntry",
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: id,
            jti: GetCurrentJti());

        return Ok(TimeTrackingService.MapToDto(entry));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEntry(Guid id)
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();
        if (currentUserId == null || organizationId == null) return Unauthorized();

        bool deleted = await _timeTrackingService.DeleteEntryAsync(id, currentUserId.Value, organizationId.Value, IsAdmin());
        if (!deleted) return NotFound(new { message = "Saisie introuvable" });

        await _auditLog.LogAsync(
            AuditAction.TimeEntryDeleted,
            entityType: "TimeEntry",
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: id,
            jti: GetCurrentJti());

        return NoContent();
    }

    private bool IsAdmin()
    {
        return User.Claims.Any(c =>
            (c.Type == "role" || c.Type == ClaimTypes.Role) &&
            c.Value == "Admin");
    }

}
