using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TMAflow.Domain.DTOs.TimeEntries;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize]
public class TimeEntriesController : ControllerBase
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

        List<TimeEntryDto> entries = await _timeTrackingService.GetEntriesAsync(
            organizationId.Value, userId, from, to);

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

        TimeEntry? entry = await _timeTrackingService.UpdateEntryAsync(id, dto, currentUserId.Value);
        if (entry == null) return NotFound(new { message = "Saisie introuvable" });

        return Ok(TimeTrackingService.MapToDto(entry));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEntry(Guid id)
    {
        Guid? currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        bool deleted = await _timeTrackingService.DeleteEntryAsync(id, currentUserId.Value);
        if (!deleted) return NotFound(new { message = "Saisie introuvable" });

        return NoContent();
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
