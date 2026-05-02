using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;
using Sentinel.Domain.DTOs.Kanban;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController : BaseController
{
    private readonly SentinelContext _context;
    private readonly TicketService _ticketService;
    private readonly ExportService _exportService;

    public TicketsController(SentinelContext context, TicketService ticketService, ExportService exportService)
    {
        _context = context;
        _ticketService = ticketService;
        _exportService = exportService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TicketDto>>> GetTickets(
        [FromQuery] string? priority,
        [FromQuery] string? status,
        [FromQuery] Guid? assignedTo,
        [FromQuery] string? type,
        [FromQuery] string? search,
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

        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.Status.ToLower() == status.ToLower());

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedToId == assignedTo.Value);

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TicketType>(type, true, out TicketType parsedType))
            query = query.Where(t => t.Type == parsedType);

        if (!string.IsNullOrWhiteSpace(search))
        {
            if (search.Length > 100)
                return BadRequest(new { message = "Recherche limitée à 100 caractères" });
            string escaped = search
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");
            string pattern = $"%{escaped}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern) ||
                t.Comments.Any(c => EF.Functions.ILike(c.Content, pattern))
            );
        }

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

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromQuery] string? priority,
        [FromQuery] string? status,
        [FromQuery] Guid? assignedTo,
        [FromQuery] string? type,
        [FromQuery] string? search)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        byte[] bytes = await _exportService.ExportTicketsExcelAsync(
            organizationId.Value, status, priority, assignedTo, type, search);
        string filename = $"tickets-{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> CreateTicket([FromBody] CreateTicketDto dto)
    {
        Guid? userId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();

        if (userId == null || organizationId == null) return Unauthorized();

        Ticket ticket = await _ticketService.CreateTicketAsync(dto, userId.Value, organizationId.Value);
        TicketDto? ticketDto = await _ticketService.GetTicketWithDetailsAsync(ticket.Id);

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

        return Ok(updatedDto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
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

        TicketComment comment = await _ticketService.AddCommentAsync(id, dto.Content, userId.Value, dto.IsInternal);

        User? user = await _context.Users.FindAsync(userId.Value);

        return CreatedAtAction(nameof(GetTicket), new { id }, new TicketCommentDto
        {
            Id = comment.Id,
            AuthorId = comment.AuthorId,
            AuthorName = user?.FullName ?? string.Empty,
            Content = comment.Content,
            IsInternal = comment.IsInternal,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        });
    }

    [HttpPut("{id:guid}/comments/{commentId:guid}")]
    public async Task<ActionResult<TicketCommentDto>> UpdateComment(Guid id, Guid commentId, [FromBody] CreateCommentDto dto)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        TicketComment? comment = await _context.TicketComments
            .Include(c => c.Author)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == id);

        if (comment == null)
            return NotFound(new { message = "Commentaire introuvable" });

        if (comment.AuthorId != userId.Value)
            return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(new { message = "Le contenu du commentaire est requis" });

        comment.Content = dto.Content;
        comment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new TicketCommentDto
        {
            Id = comment.Id,
            AuthorId = comment.AuthorId,
            AuthorName = comment.Author?.FullName ?? string.Empty,
            Content = comment.Content,
            IsInternal = comment.IsInternal,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        });
    }

    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        Guid? userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        TicketComment? comment = await _context.TicketComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == id);

        if (comment == null)
            return NotFound(new { message = "Commentaire introuvable" });

        if (comment.AuthorId != userId.Value)
            return Forbid();

        _context.TicketComments.Remove(comment);
        await _context.SaveChangesAsync();

        return NoContent();
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

        // Accept any non-empty status string up to 50 chars
        if (string.IsNullOrWhiteSpace(dto.Status) || dto.Status.Length > 50)
            return BadRequest(new { message = $"Statut invalide : {dto.Status}" });

        await _ticketService.ChangeStatusAsync(id, dto.Status, userId.Value);
        TicketDto? updatedDto = await _ticketService.GetTicketWithDetailsAsync(id);

        return Ok(updatedDto);
    }

    [HttpPatch("{id:guid}/column")]
    public async Task<ActionResult<TicketDto>> MoveToColumn(Guid id, [FromBody] MoveTicketToColumnDto dto)
    {
        Guid? userId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();
        if (userId == null || organizationId == null) return Unauthorized();

        Ticket? ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId);
        if (ticket == null)
            return NotFound(new { message = "Ticket introuvable" });

        if (dto.ColumnId.HasValue)
        {
            KanbanColumn? column = await _context.KanbanColumns
                .FirstOrDefaultAsync(c => c.Id == dto.ColumnId.Value && c.OrganizationId == organizationId.Value);
            if (column == null)
                return BadRequest(new { message = "Colonne introuvable" });

            // Set ticket status to the column's system status if present, otherwise use the column name
            ticket.Status = column.SystemStatus ?? column.Name;
        }

        ticket.KanbanColumnId = dto.ColumnId;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        TicketDto? updatedDto = await _ticketService.GetTicketWithDetailsAsync(id);
        return Ok(updatedDto);
    }

}
