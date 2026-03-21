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

    public TimeEntriesController(TimeTrackingService timeTrackingService)
    {
        _timeTrackingService = timeTrackingService;
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

    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> CreateEntry([FromBody] CreateTimeEntryDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        TimeEntry entry = await _timeTrackingService.CreateManualEntryAsync(dto, currentUserId.Value);
        TimeEntryDto entryDto = TimeTrackingService.MapToDto(entry);

        return CreatedAtAction(nameof(GetEntries), entryDto);
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<TimeEntryDto>> UpdateEntry(Guid id, [FromBody] UpdateTimeEntryDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        TimeEntry? entry = await _timeTrackingService.UpdateEntryAsync(id, dto, currentUserId.Value, IsAdmin());
        if (entry == null) return NotFound(new { message = "Saisie introuvable" });

        return Ok(TimeTrackingService.MapToDto(entry));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEntry(Guid id)
    {
        Guid? currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        bool deleted = await _timeTrackingService.DeleteEntryAsync(id, currentUserId.Value, IsAdmin());
        if (!deleted) return NotFound(new { message = "Saisie introuvable" });

        return NoContent();
    }

    private bool IsAdmin()
    {
        return User.Claims.Any(c =>
            (c.Type == "role" || c.Type == ClaimTypes.Role) &&
            c.Value == "Admin");
    }

}
