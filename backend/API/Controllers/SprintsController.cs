using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Domain.DTOs.Sprints;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/sprints")]
[Authorize]
public class SprintsController : BaseController
{
    private readonly SprintService _sprintService;

    public SprintsController(SprintService sprintService)
    {
        _sprintService = sprintService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SprintDto>>> GetSprints([FromQuery] Guid? projectId)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        List<SprintDto> sprints = await _sprintService.GetSprintsAsync(organizationId.Value, projectId);
        return Ok(sprints);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SprintDto>> GetSprint(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        SprintDto? sprint = await _sprintService.GetSprintAsync(id, organizationId.Value);
        if (sprint == null) return NotFound(new { message = "Sprint introuvable" });

        return Ok(sprint);
    }

    [HttpPost]
    public async Task<ActionResult<SprintDto>> CreateSprint([FromBody] CreateSprintDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        try
        {
            Domain.Models.Sprint sprint = await _sprintService.CreateSprintAsync(dto, organizationId.Value);
            SprintDto? sprintDto = await _sprintService.GetSprintAsync(sprint.Id, organizationId.Value);
            return CreatedAtAction(nameof(GetSprint), new { id = sprint.Id }, sprintDto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SprintDto>> UpdateSprint(Guid id, [FromBody] UpdateSprintDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Domain.Models.Sprint? sprint = await _sprintService.UpdateSprintAsync(id, dto, organizationId.Value);
        if (sprint == null) return NotFound(new { message = "Sprint introuvable" });

        SprintDto? sprintDto = await _sprintService.GetSprintAsync(sprint.Id, organizationId.Value);
        return Ok(sprintDto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSprint(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool deleted = await _sprintService.DeleteSprintAsync(id, organizationId.Value);
        if (!deleted) return NotFound(new { message = "Sprint introuvable" });

        return NoContent();
    }

    [HttpPost("{id:guid}/tickets/{ticketId:guid}")]
    public async Task<IActionResult> AssignTicket(Guid id, Guid ticketId)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool success = await _sprintService.AssignTicketToSprintAsync(id, ticketId, organizationId.Value);
        if (!success) return NotFound(new { message = "Sprint ou ticket introuvable" });

        return NoContent();
    }

    [HttpDelete("{id:guid}/tickets/{ticketId:guid}")]
    public async Task<IActionResult> RemoveTicket(Guid id, Guid ticketId)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool success = await _sprintService.RemoveTicketFromSprintAsync(id, ticketId, organizationId.Value);
        if (!success) return NotFound(new { message = "Ticket introuvable dans ce sprint" });

        return NoContent();
    }
}
