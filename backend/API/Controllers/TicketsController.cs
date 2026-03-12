using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.Common;
using TMAflow.Domain.DTOs.Tickets;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly TMAflowContext _context;
    private readonly TicketService _ticketService;
    private readonly AuditService _auditService;

    public TicketsController(TMAflowContext context, TicketService ticketService, AuditService auditService)
    {
        _context = context;
        _ticketService = ticketService;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TicketDto>>> GetTickets(
        [FromQuery] string? priority,
        [FromQuery] string? status,
        [FromQuery] Guid? assignedTo,
        [FromQuery] string? type,
        [FromQuery] bool? slaBreached,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        IQueryable<Ticket> query = _context.Tickets
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.TimeEntries)
            .Where(t => t.OrganizationId == organizationId.Value);

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, true, out TicketPriority parsedPriority))
            query = query.Where(t => t.Priority == parsedPriority);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TicketStatus>(status, true, out TicketStatus parsedStatus))
            query = query.Where(t => t.Status == parsedStatus);

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedToId == assignedTo.Value);

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TicketType>(type, true, out TicketType parsedType))
            query = query.Where(t => t.Type == parsedType);

        if (slaBreached.HasValue)
            query = query.Where(t => t.SlaBreached == slaBreached.Value);

        int totalCount = await query.CountAsync();

        List<Ticket> tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<TicketDto>
        {
            Items = tickets.Select(TicketService.MapToDto),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> CreateTicket([FromBody] CreateTicketDto dto)
    {
        Guid? userId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();

        if (userId == null || organizationId == null) return Unauthorized();

        Ticket ticket = await _ticketService.CreateTicketAsync(dto, userId.Value, organizationId.Value);
        TicketDto? ticketDto = await _ticketService.GetTicketWithDetailsAsync(ticket.Id);

        await _auditService.LogAsync(userId, "TICKET_CREATED", "Ticket", ticket.Id);

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticketDto);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDto>> GetTicket(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        TicketDto? ticket = await _ticketService.GetTicketWithDetailsAsync(id);

        if (ticket == null)
            return NotFound(new { message = "Ticket introuvable" });

        bool exists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId.Value);
        if (!exists)
            return Forbid();

        return Ok(ticket);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TicketDto>> UpdateTicket(Guid id, [FromBody] UpdateTicketDto dto)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        Ticket? ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (ticket == null)
            return NotFound(new { message = "Ticket introuvable" });

        await _ticketService.UpdateTicketAsync(id, dto, userId.Value);
        TicketDto? updatedDto = await _ticketService.GetTicketWithDetailsAsync(id);

        await _auditService.LogAsync(userId, "TICKET_UPDATED", "Ticket", id);

        return Ok(updatedDto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteTicket(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        Ticket? ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (ticket == null)
            return NotFound(new { message = "Ticket introuvable" });

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<TicketCommentDto>> AddComment(Guid id, [FromBody] CreateCommentDto dto)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        bool ticketExists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (!ticketExists)
            return NotFound(new { message = "Ticket introuvable" });

        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(new { message = "Le contenu du commentaire est requis" });

        TicketComment comment = await _ticketService.AddCommentAsync(id, dto.Content, userId.Value);

        User? user = await _context.Users.FindAsync(userId.Value);

        return CreatedAtAction(nameof(GetTicket), new { id }, new TicketCommentDto
        {
            Id = comment.Id,
            AuthorId = comment.AuthorId,
            AuthorName = user?.FullName ?? string.Empty,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TicketDto>> ChangeStatus(Guid id, [FromBody] ChangeStatusDto dto)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        bool ticketExists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (!ticketExists)
            return NotFound(new { message = "Ticket introuvable" });

        Dictionary<string, TicketStatus> statusMap = new Dictionary<string, TicketStatus>(StringComparer.OrdinalIgnoreCase)
        {
            ["new"] = TicketStatus.New,
            ["in_progress"] = TicketStatus.InProgress,
            ["inprogress"] = TicketStatus.InProgress,
            ["testing"] = TicketStatus.Testing,
            ["resolved"] = TicketStatus.Resolved,
            ["closed"] = TicketStatus.Closed,
        };

        if (!statusMap.TryGetValue(dto.Status, out TicketStatus ticketStatus))
            return BadRequest(new { message = $"Statut invalide : {dto.Status}" });

        await _ticketService.ChangeStatusAsync(id, ticketStatus, userId.Value);
        TicketDto? updatedDto = await _ticketService.GetTicketWithDetailsAsync(id);

        await _auditService.LogAsync(userId, "TICKET_STATUS_CHANGED", "Ticket", id);

        return Ok(updatedDto);
    }

    [HttpPost("{id:guid}/timer/start")]
    public async Task<IActionResult> StartTimer(Guid id)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        bool ticketExists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (!ticketExists)
            return NotFound(new { message = "Ticket introuvable" });

        TimeEntry? entry = await _ticketService.StartTimerAsync(id, userId.Value);
        return Ok(new { timeEntryId = entry?.Id, startedAt = entry?.TimerStartedAt });
    }

    [HttpPost("{id:guid}/timer/stop")]
    public async Task<IActionResult> StopTimer(Guid id)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        TimeEntry? entry = await _ticketService.StopTimerAsync(id, userId.Value);

        if (entry == null)
            return NotFound(new { message = "Aucun timer actif trouvé pour ce ticket" });

        return Ok(new
        {
            timeEntryId = entry.Id,
            durationMinutes = entry.DurationMinutes,
            durationFormatted = $"{entry.DurationMinutes / 60}h{entry.DurationMinutes % 60:D2}m"
        });
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
